import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { withHashLocation } from '@angular/router';
import { TranslationService } from './shared/services/translation.service';
import { getStoredLanguage } from './shared/utils/profile-language';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslationService],
      useFactory: (translationService: TranslationService) => () => {
        translationService.setLanguage(getStoredLanguage());
      },
    },
  ],
};
