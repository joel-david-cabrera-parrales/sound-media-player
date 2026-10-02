const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialogue: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectoryDialogue: () => ipcRenderer.invoke('dialog:openDirectory'),
  // Aquí añadirás más funciones como leer carpetas, etc.
});
