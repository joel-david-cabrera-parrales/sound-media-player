# 🚀 Guía Maestro: Angular Standalone + Electron

## Fase 1: Preparación de Angular (Frontend)

1. **Crear el proyecto:**

   ```bash
   ng new music-player --standalone --routing --style=scss
   cd music-player
   ```

2. **Configurar el Enrutamiento (Crucial para Electron):**
   En Angular Standalone, la configuración ocurre en `app.config.ts` (o `main.ts`). Debes usar la estrategia de **Hash** para evitar errores de página en blanco en producción.

   ```typescript
   // src/app/app.config.ts
   import { ApplicationConfig } from '@angular/core';
   import { provideRouter, withHashLocationStrategy } from '@angular/router';
   import { routes } from './app.routes';

   export const appConfig: ApplicationConfig = {
     providers: [
       provideRouter(routes, withHashLocationStrategy()), // <--- ESTO ES VITAL
     ],
   };
   ```

---

## Fase 2: Configuración de Electron (Backend/Main Process)

Para mantener el proyecto profesional, **no mezcles el código de Electron con el de Angular**.

1. **Instalar dependencias:**

   ```bash
   npm install electron --save-dev
   npm install concurrently wait-on --save-dev
   ```

2. **Crear la estructura de carpetas:**
   Crea una carpeta llamada `electron` en la raíz del proyecto.

   ```text
   music-player/
   ├── electron/
   │   ├── main.js
   │   └── preload.js
   ├── src/
   ├── package.json
   └── ...
   ```

3. **El archivo `electron/main.js` (El Cerebro):**
   Este archivo controla la ventana y el acceso al sistema operativo.

   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         preload: path.join(__dirname, 'preload.js'), // Puente de seguridad
         nodeIntegration: false, // Seguridad: No permitimos Node en el frontend
         contextIsolation: true, // Seguridad: Aislamos el contexto
       },
     });

     // Si estamos en desarrollo, cargamos el servidor de Angular
     // Si estamos en producción, cargamos el archivo index.html compilado
     const isDev = process.env.NODE_ENV === 'development';
     if (isDev) {
       win.loadURL('http://localhost:4200');
       win.webContents.openDevTools(); // Abre la consola automáticamente en dev
     } else {
       win.loadFile(path.join(__dirname, '../dist/music-player/browser/index.html'));
     }
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') app.quit();
   });
   ```

4. **El archivo `electron/preload.js` (El Puente):**
   **Regla de Oro:** Nunca pongas `nodeIntegration: true`. Usa el preload para exponer solo las funciones que Angular necesita.

   ```javascript
   const { contextBridge, ipcRenderer } = require('electron');

   contextBridge.exposeInMainWorld('electronAPI', {
     // Aquí defines las funciones que Angular podrá llamar
     sendMsg: (msg) => ipcRenderer.send('message', msg),
     receiveMsg: (callback) => ipcRenderer.on('reply', (event, ...args) => callback(...args)),
   });
   ```

---

## Fase 3: Configuración del `package.json`

Aquí es donde corregimos el error que tuviste anteriormente. El `main` debe apuntar exactamente a donde está tu archivo de Electron.

```json
{
  "name": "music-player",
  "version": "1.0.0",
  "main": "electron/main.js", // <--- PUNTO DE ENTRADA CORRECTO
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "electron": "electron .",
    "electron-dev": "cross-env NODE_ENV=development concurrently \"npm start\" \"wait-on http://localhost:4200 && npm run electron\""
  },
  ...
}
```

_Nota: Si estás en Windows, instala `npm install cross-env --save-dev` para que `NODE_ENV=development` funcione correctamente._

---

## Fase 4: Cómo conectar Angular con Electron (Frontend $\rightarrow$ Backend)

Para que tu código de Angular sea limpio, crea un servicio que gestione la comunicación con Electron.

1. **Crear el Servicio:** `ng generate service core/services/electron`

2. **Implementar el servicio:**
   Para que TypeScript no se queje de que `window.electronAPI` no existe, debes definirlo.

   ```typescript
   // src/app/core/services/electron.service.ts
   import { Injectable } from '@angular/core';

   declare global {
     interface Window {
       electronAPI: any;
     }
   }

   @Injectable({ providedIn: 'root' })
   export class ElectronService {
     sendMessage(msg: string) {
       window.electronAPI.sendMsg(msg);
     }

     listenToMessages(callback: (data: any) => void) {
       window.electronAPI.receiveMsg(callback);
     }
   }
   ```

---

# 🛠 Resumen de Ejecución para Desarrollo

Cuando quieras trabajar en tu proyecto, solo abre la terminal en la raíz de `music-player` y ejecuta:

```bash
npm run electron-dev
```

**¿Qué pasará internamente?**

1. `concurrently` lanzará `ng serve`.
2. `wait-on` esperará a que el servidor de Angular esté listo en el puerto 4200.
3. Una vez listo, lanzará `electron .`, que leerá el `package.json`, buscará la propiedad `"main": "electron/main.js"` y abrirá tu ventana.

### 🌟 Tips para tu Portafolio (Valor Agregado)

1. **Lazy Loading:** Usa `loadComponent` en tus rutas para demostrar que sabes optimizar el rendimiento.
2. **Interfaces:** No uses `any` en el `ElectronService`. Define interfaces para los datos que viajan entre Electron y Angular.
3. **Build de Producción:** Cuando termines, ejecuta `ng build`. Luego, cambia `NODE_ENV` a producción y Electron cargará los archivos estáticos desde la carpeta `dist`, lo cual es mucho más rápido.
