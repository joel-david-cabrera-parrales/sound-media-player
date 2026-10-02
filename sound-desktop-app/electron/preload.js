const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialogue: () => ipcRenderer.invoke('dialog:openFile'),
  // Aquí añadirás más funciones como leer carpetas, etc.
});
