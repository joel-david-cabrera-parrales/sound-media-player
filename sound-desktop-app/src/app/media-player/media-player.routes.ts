import { Routes } from '@angular/router';
import { MediaPlayerLayout } from './layouts/media-player/media-player-layout';
import { Home } from './pages/home/home';
import { ImmersiveMusicPlayer } from './pages/immersive-music-player/immersive-music-player';
import { ImmersiveMediaPlayerLayout } from './layouts/immersive-media-player/immersive-media-player';
import { ImportLocalFiles } from './pages/import-local-files/import-local-files';
import { ArtistProfile } from './pages/artist-profile/artist-profile';
import { Artist } from './pages/artist/artist';
import { Library } from './pages/library/library';
import { Search } from './pages/search/search';

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
        path: 'import-local-files',
        component: ImportLocalFiles,
      },
      {
        path: 'list-artists',
        component: Artist,
      },
      {
        path: 'artist/:artistId',
        component: ArtistProfile,
      },
      {
        path: 'library',
        component: Library,
      },
      {
        path: 'search',
        component: Search,
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
