const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Importante para seguridad
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Se oculta el menu de windows
  win.setMenuBarVisibility(false);

  // En desarrollo, cargamos el servidor de Angular
  win.loadURL('http://localhost:4200');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
