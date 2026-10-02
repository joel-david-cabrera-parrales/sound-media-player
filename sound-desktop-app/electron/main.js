const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Esquema privilegiado para poder usarlo en <img> y fetch desde el renderer
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sound-photo',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

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

// Convierte sound-photo:///C:/ruta/foto.png -> archivo local servido al renderer
function registerPhotoProtocol() {
  protocol.handle('sound-photo', (request) => {
    try {
      const url = new URL(request.url);
      // En Windows el pathname llega como /C:/ruta/... -> se quita la barra inicial
      let filePath = decodeURIComponent(url.pathname);
      if (/^\/[A-Za-z]:\//.test(filePath)) {
        filePath = filePath.slice(1);
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response('Foto no encontrada', { status: 404 });
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
  win.loadURL('http://localhost:4200');
}

app.whenReady().then(() => {
  registerPhotoProtocol();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
