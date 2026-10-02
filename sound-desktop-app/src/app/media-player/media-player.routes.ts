import { Routes } from '@angular/router';
import { MediaPlayerLayout } from './layouts/media-player-layout';
import { Home } from './pages/home/home';
import { ImmersiveMusicPlayer } from './pages/immersive-music-player/immersive-music-player';

export const routes: Routes = [
  {
    path: '',
    component: MediaPlayerLayout,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: Home,
      },
      {
        path: 'immersive',
        component: ImmersiveMusicPlayer,
      },
    ],
  },
];

export default routes;
