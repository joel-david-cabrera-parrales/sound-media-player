const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { Readable } = require('node:stream');

// Esquemas privilegiados para poder usarlos en <img>, <audio> y fetch desde el renderer
// bypassCSP/corsEnabled: evita "Media load rejected by URL safety check" en <audio>/<img>.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sound-photo',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
  {
    scheme: 'sound-audio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
  {
    scheme: 'sound-cover',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
]);

const AUDIO_EXTS = new Set([
  '.mp3',
  '.flac',
  '.m4a',
  '.mp4',
  '.ogg',
  '.oga',
  '.opus',
  '.wav',
  '.aiff',
  '.aif',
  '.wma',
  '.aac',
  '.dsf',
  '.dff',
]);

function tailAfterScheme(requestUrl, scheme) {
  const prefix = `${scheme}://`;
  let tail = requestUrl.startsWith(prefix) ? requestUrl.slice(prefix.length) : requestUrl;
  // Quitar query/hash que Chromium pueda añadir
  const cut = tail.search(/[?#]/);
  if (cut !== -1) tail = tail.slice(0, cut);
  // Chromium añade `/` final a hosts sin path (ej. sound-cover://key -> sound-cover://key/)
  tail = tail.replace(/\/+$/, '');
  return tail;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function queryParam(requestUrl, name) {
  try {
    const url = new URL(requestUrl);
    const value = url.searchParams.get(name);
    if (value) return value;
  } catch {
    // URLs legacy sin query válida: se parsea por cola
  }
  return null;
}

function repairDriveLetter(filePath) {
  // Chromium normaliza `sound-photo:///C:/...` a `sound-photo://c/...`
  // (unidad al host, minúscula, sin dos puntos). Se reconstruye `C:/...`.
  if (/^[A-Za-z]\//.test(filePath) && !/^[A-Za-z]:\//.test(filePath)) {
    return `${filePath[0].toUpperCase()}:/${filePath.slice(2)}`;
  }
  if (/^[A-Za-z]$/.test(filePath)) {
    return `${filePath.toUpperCase()}:/`;
  }
  return filePath;
}

function toFilePathFromUrl(requestUrl, scheme) {
  // Formato query: sound-audio://media?path=<encodeURIComponent(D:/ruta/tema.flac)>
  const fromQuery = queryParam(requestUrl, 'path');
  if (fromQuery) return fromQuery;
  // Legacy: sound-audio://<encodeURIComponent(...)>, sound-audio:///C:/..., sound-photo:///C:/...
  const tail = tailAfterScheme(requestUrl, scheme || 'sound-audio');
  let filePath = repairDriveLetter(safeDecode(tail));
  // Legacy triple-slash: queda /C:/... -> se quita la barra inicial
  if (/^\/[A-Za-z]:\//.test(filePath)) {
    filePath = filePath.slice(1);
  }
  // file:// URLs que lleguen por net.fetch interno: file:///C:/...
  if (/^file:\/\//i.test(filePath)) {
    try {
      const u = new URL(filePath);
      filePath = safeDecode(u.pathname);
      if (/^\/[A-Za-z]:\//.test(filePath)) filePath = filePath.slice(1);
    } catch {
      // se deja tal cual
    }
  }
  return filePath;
}

function coverKeyFromUrl(requestUrl) {
  // Formato query: sound-cover://cover?key=<hash.jpg>
  const fromQuery = queryParam(requestUrl, 'key');
  if (fromQuery) return fromQuery.split('/').pop().split('\\').pop() || '';
  // Legacy: sound-cover://<hash.jpg> | sound-cover:///hash.jpg
  const tail = tailAfterScheme(requestUrl, 'sound-cover');
  const decoded = safeDecode(tail).replace(/^\/+/, '').replace(/\/+$/, '');
  // Quedarse con el basename por si llega con path
  const base = decoded.split('/').pop().split('\\').pop() || '';
  return base;
}

const AUDIO_MIME = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.aiff': 'audio/aiff',
  '.aif': 'audio/aiff',
  '.wma': 'audio/x-ms-wma',
  '.aac': 'audio/aac',
  '.dsf': 'audio/dsf',
  '.dff': 'audio/dff',
};

function audioMime(filePath) {
  return AUDIO_MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/** Solo single-range: bytes=s-e | bytes=s- | bytes=-suffix */
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start;
  let end;
  if (m[1] === '') {
    const suffix = parseInt(m[2], 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : parseInt(m[2], 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || end < start)
      return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

/**
 * Sirve audio con soporte de rangos (206) para que el seek del <audio>
 * no reinicie la canción. Sin Range devuelve 200 streameado.
 * Nunca lee el archivo entero en memoria (FLACs grandes a salvo).
 */
async function serveAudio(request) {
  let filePath;
  try {
    filePath = toFilePathFromUrl(request.url, 'sound-audio');
  } catch (err) {
    console.error('[sound-audio] URL inválida:', request.url, err);
    return new Response('Audio no válido', { status: 400 });
  }
  if (!filePath) {
    return new Response('Audio no encontrado', { status: 404 });
  }
  let stat;
  try {
    stat = await fsp.stat(filePath);
    if (!stat.isFile()) throw new Error('no es archivo');
  } catch {
    console.error('[sound-audio] no encontrado:', request.url, '->', filePath);
    return new Response('Audio no encontrado', { status: 404 });
  }
  const size = stat.size;
  const mime = audioMime(filePath);
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return new Response(Readable.toWeb(fs.createReadStream(filePath)), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(size),
        'Accept-Ranges': 'bytes',
      },
    });
  }
  const range = parseRange(rangeHeader, size);
  if (!range) {
    return new Response('Rango no válido', {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
    });
  }
  const { start, end } = range;
  // Log de diagnóstico (desactivado por ruido en consola):
  // console.log(`[sound-audio] range ${start}-${end}/${size}:`, filePath);
  return new Response(Readable.toWeb(fs.createReadStream(filePath, { start, end })), {
    status: 206,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
    },
  });
}

function serveLocalFile(request, notFoundMessage, scheme) {
  try {
    const filePath = toFilePathFromUrl(request.url, scheme);
    if (!filePath || !fs.existsSync(filePath)) {
      console.error(`[${scheme}] no encontrado:`, request.url, '->', filePath);
      return new Response(notFoundMessage, { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  } catch (err) {
    console.error(`[${scheme}] error sirviendo:`, request.url, err);
    return new Response(notFoundMessage, { status: 404 });
  }
}

// Diálogo nativo para elegir la foto de perfil (lo invoca el preload: dialog:openFile)
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Elige tu foto de perfil',
    properties: ['openFile'],
    filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }],
  });
  if (canceled || filePaths.length === 0) {
    return { canceled: true, filePath: null };
  }
  return { canceled: false, filePath: filePaths[0] };
});

// Cierra la aplicación (lo invoca el preload: app:quit)
ipcMain.handle('app:quit', () => {
  app.quit();
});

// Diálogo nativo para elegir carpeta de música (preload: dialog:openDirectory)
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Elige una carpeta de música',
    properties: ['openDirectory'],
  });
  if (canceled || filePaths.length === 0) {
    return { canceled: true, dirPath: null };
  }
  return { canceled: false, dirPath: filePaths[0] };
});

// Recorre una carpeta de forma recursiva y devuelve rutas de audio
async function walkAudioFiles(rootDir) {
  const results = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      continue; // sin permisos -> se salta
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        if (AUDIO_EXTS.has(path.extname(entry.name).toLowerCase())) {
          results.push(full);
        }
      }
    }
  }
  return results;
}

function coversDir() {
  const dir = path.join(app.getPath('userData'), 'covers');
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // si no se puede crear, se ignora y no se cachean carátulas
  }
  return dir;
}

function baseNameTitle(filePath) {
  return (
    path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, ' ').trim() ||
    'Pista desconocida'
  );
}

function formatQuality(bitsPerSample, sampleRate) {
  if (!bitsPerSample && !sampleRate) return null;
  const bits = bitsPerSample ? `${bitsPerSample}-bit` : null;
  const khz = sampleRate ? `${(sampleRate / 1000).toFixed(1).replace(/\.0$/, '')}kHz` : null;
  return [bits, khz].filter(Boolean).join(' / ');
}

// Escanea una carpeta: lee metadata real con music-metadata (import dinámico porque main es CJS)
ipcMain.handle('library:scanFolder', async (event, { folderId, dirPath }) => {
  const startedAt = Date.now();
  const files = await walkAudioFiles(dirPath);
  const total = files.length;
  const { parseFile } = await import('music-metadata');
  const dir = coversDir();
  const tracks = [];
  let errors = 0;

  const CONCURRENCY = 8;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const parsed = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const stat = await fsp.stat(filePath);
          const metadata = await parseFile(filePath, { duration: true });
          const common = metadata.common || {};
          const format = metadata.format || {};
          const ext = path.extname(filePath).slice(1).toUpperCase() || 'AUDIO';

          let coverCacheKey = null;
          const picture = common.picture && common.picture[0];
          if (
            picture &&
            picture.data &&
            picture.data.length > 0 &&
            picture.data.length < 8 * 1024 * 1024
          ) {
            try {
              const hash = crypto.createHash('md5').update(filePath).digest('hex');
              const coverExt = (picture.format || '').includes('png') ? 'png' : 'jpg';
              const coverPath = path.join(dir, `${hash}.${coverExt}`);
              if (!fs.existsSync(coverPath)) {
                await fsp.writeFile(coverPath, Buffer.from(picture.data));
              }
              coverCacheKey = `${hash}.${coverExt}`;
            } catch {
              coverCacheKey = null;
            }
          }

          const bits = format.bitsPerSample || null;
          const sampleRate = format.sampleRate || null;
          const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : null;
          const quality = formatQuality(bits, sampleRate);
          const label = quality ? `${ext} ${quality}` : ext;
          const hiRes =
            (bits != null && bits > 16) ||
            (sampleRate != null && sampleRate > 48000) ||
            ext === 'FLAC' ||
            ext === 'DSF' ||
            ext === 'DFF';

          return {
            id: `${folderId}::${crypto.createHash('md5').update(filePath).digest('hex')}`,
            folderId,
            filePath,
            title: common.title || baseNameTitle(filePath),
            artist: common.artist || 'Artista desconocido',
            album: common.album || 'Álbum desconocido',
            genre: Array.isArray(common.genre) ? common.genre[0] : common.genre || null,
            year: common.year || null,
            trackNo: (common.track && common.track.no) || null,
            durationSec: format.duration ? Math.round(format.duration) : null,
            format: label,
            codec: format.codec || ext,
            bitrateKbps: bitrate,
            sampleRateHz: sampleRate,
            bitsPerSample: bits,
            sizeBytes: stat.size,
            coverCacheKey,
            hiRes,
          };
        } catch {
          errors += 1;
          return null;
        }
      }),
    );
    for (const t of parsed) {
      if (t) tracks.push(t);
    }
    try {
      event.sender.send('library:scan-progress', {
        folderId,
        done: Math.min(i + CONCURRENCY, total),
        total,
      });
    } catch {
      // la ventana pudo cerrarse
    }
  }

  // Orden estable por artista/album/pista para verificar fácil
  tracks.sort((a, b) =>
    `${a.artist}${a.album}${a.trackNo ?? ''}${a.title}`.localeCompare(
      `${b.artist}${b.album}${b.trackNo ?? ''}${b.title}`,
    ),
  );

  return { tracks, total, errors, scannedMs: Date.now() - startedAt };
});

// Obtiene imagen de artista desde Deezer API (sin CORS en main process)
ipcMain.handle('artist:fetchDeezerImage', async (_event, artistName) => {
  try {
    const normalized = String(artistName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    if (!normalized) return null;
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(normalized)}&limit=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.[0]?.artist?.picture_xl ?? null;
  } catch {
    return null;
  }
});

// Convierte sound-photo://<encodeURIComponent(C:/ruta/foto.png)> -> archivo local (acepta legacy ///C:/...)
function registerPhotoProtocol() {
  protocol.handle('sound-photo', (request) =>
    serveLocalFile(request, 'Foto no encontrada', 'sound-photo'),
  );
}

function registerMediaProtocols() {
  protocol.handle('sound-audio', (request) => serveAudio(request));
  protocol.handle('sound-cover', (request) => {
    try {
      // sound-cover://hash.jpg -> buscar en userData/covers
      const key = coverKeyFromUrl(request.url);
      if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
        console.error('[sound-cover] clave no válida:', request.url, '->', key);
        return new Response('Carátula no válida', { status: 400 });
      }
      const full = path.join(coversDir(), key);
      if (!fs.existsSync(full)) {
        console.error('[sound-cover] no encontrada:', request.url, '->', full);
        return new Response('Carátula no encontrada', { status: 404 });
      }
      return net.fetch(pathToFileURL(full).toString());
    } catch (err) {
      console.error('[sound-cover] error:', request.url, err);
      return new Response('Carátula no encontrada', { status: 404 });
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Importante para seguridad
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Se oculta el menu de windows
  win.setMenuBarVisibility(false);
  win.webContents.openDevTools();

  // En desarrollo, cargamos el servidor de Angular
  win.loadURL('http://localhost:4205');
}

app.whenReady().then(() => {
  registerPhotoProtocol();
  registerMediaProtocols();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
