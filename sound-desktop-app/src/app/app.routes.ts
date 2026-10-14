import { Routes } from '@angular/router';
import { requireProfileGuard } from './welcome/guards/profile-setup.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.routes'),
  },
  {
    path: 'media-player',
    loadChildren: () => import('./media-player/media-player.routes'),
    canActivate: [requireProfileGuard],
  },
  {
    path: 'library',
    loadChildren: () => import('./media-player/media-player.routes'),
    canActivate: [requireProfileGuard],
  },
  {
    path: 'playlist',
    loadChildren: () => import('./playlist/playlist.routes'),
    canActivate: [requireProfileGuard],
  },
  {
    path: 'not-found',
    loadChildren: () => import('./shared/shared.routes'),
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
