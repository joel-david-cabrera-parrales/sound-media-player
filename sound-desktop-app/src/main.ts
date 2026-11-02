// Inicializa la base de assets antes de que el router cambie la URL.
import './app/shared/utils/app-asset-url';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
