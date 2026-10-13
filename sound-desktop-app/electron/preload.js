const { contextBridge, ipcRenderer } = require('electron');

// Formato query: host ficticio + valor en query, porque Chromium valida el
// host estrictamente y rechaza rutas codificadas en posición de host
// ("Media load rejected by URL safety check").
//   audio: sound-audio://media?path=<encodeURIComponent(D:/ruta/tema.flac)>
//   cover: sound-cover://cover?key=<hash.jpg>
//   photo: sound-photo://photo?path=<encodeURIComponent(C:/ruta/foto.png)>
function toMediaUrl(scheme, value) {
  const str = String(value || '');
  if (!str) return '';
  if (scheme === 'sound-cover') {
    return `${scheme}://cover?key=${encodeURIComponent(str)}`;
  }
  const normalized = str.replace(/\\/g, '/');
  const host = scheme === 'sound-photo' ? 'photo' : 'media';
  return `${scheme}://${host}?path=${encodeURIComponent(normalized)}`;
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialogue: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectoryDialogue: () => ipcRenderer.invoke('dialog:openDirectory'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  scanFolder: (input) => ipcRenderer.invoke('library:scanFolder', input),
  onScanProgress: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('library:scan-progress', listener);
    return () => ipcRenderer.removeListener('library:scan-progress', listener);
  },
  toAudioUrl: (filePath) => toMediaUrl('sound-audio', filePath),
  toCoverUrl: (coverCacheKey) => toMediaUrl('sound-cover', coverCacheKey),
  toPhotoUrl: (filePath) => toMediaUrl('sound-photo', filePath),
  fetchDeezerArtistImage: (artistName) => ipcRenderer.invoke('artist:fetchDeezerImage', artistName),
});
