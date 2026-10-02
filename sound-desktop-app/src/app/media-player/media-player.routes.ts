import { Routes } from '@angular/router';
import { MediaPlayerLayout } from './layouts/media-player/media-player-layout';
import { Home } from './pages/home/home';
import { ImmersiveMusicPlayer } from './pages/immersive-music-player/immersive-music-player';
import { ImmersiveMediaPlayerLayout } from './layouts/immersive-media-player/immersive-media-player';

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
    ],
  },
  {
    path: 'immersive',
    component: ImmersiveMediaPlayerLayout,
    children: [
      {
        path: '',
        redirectTo: 'immersive',
        pathMatch: 'full',
      },
      {
        path: 'immersive',
        component: ImmersiveMusicPlayer,
      },
    ],
  },
];

export default routes;
