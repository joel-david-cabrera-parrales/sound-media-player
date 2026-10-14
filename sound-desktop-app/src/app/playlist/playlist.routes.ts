import { Routes } from '@angular/router';
import { MediaPlayerLayout } from '../media-player/layouts/media-player/media-player-layout';
import { PlaylistsList } from './pages/playlists-list/playlists-list';
import { PlaylistBuilder } from './pages/playlist-builder/playlist-builder';
import { PlaylistDetail } from './pages/playlist-detail/playlist-detail';

export const routes: Routes = [
  {
    path: '',
    component: MediaPlayerLayout,
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        component: PlaylistsList,
      },
      {
        path: ':id/edit',
        component: PlaylistBuilder,
      },
      {
        path: ':id',
        component: PlaylistDetail,
      },
    ],
  },
];

export default routes;
