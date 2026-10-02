import { Route } from '@angular/router';
import { WelcomeLayout } from './layouts/welcome-layout';
import { WelcomeApp } from './pages/welcome-app/welcome-app';
import { InitialSetup } from './pages/initial-setup/initial-setup';
import { GeneralSetup } from './pages/general-setup/general-setup';

export const routes: Route[] = [
  {
    path: '',
    component: WelcomeLayout,
    children: [
      {
        path: '',
        component: WelcomeApp,
      },
      {
        path: 'initial-setup',
        component: InitialSetup,
      },
      {
        path: 'general-setup',
        component: GeneralSetup,
      },
    ],
  },
];

export default routes;
