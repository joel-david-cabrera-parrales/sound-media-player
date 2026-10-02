import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.routes'),
  },
  {
    path: 'not-found',
    loadChildren: () => import('./shared/shared.routes'),
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
