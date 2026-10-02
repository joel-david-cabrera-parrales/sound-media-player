import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.routes'),
  },
  {
    path: 'media-player',
    loadChildren: () => import('./media-player/media-player.routes'),
  },
  {
    path: 'library',
    loadChildren: () => import('./media-player/media-player.routes'),
  },
  {
    path: 'not-found',
    loadChildren: () => import('./shared/shared.routes'),
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
