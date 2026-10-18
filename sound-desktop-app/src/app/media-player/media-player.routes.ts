import { Routes } from '@angular/router';
import { MediaPlayerLayout } from './layouts/media-player/media-player-layout';
import { Home } from './features/home/pages/home/home';
import { ImmersiveMusicPlayer } from './pages/immersive-music-player/immersive-music-player';
import { ImmersiveMediaPlayerLayout } from './layouts/immersive-media-player/immersive-media-player';
import { ImportLocalFiles } from './pages/import-local-files/import-local-files';
import { ArtistProfile } from './pages/artist-profile/artist-profile';
import { Artist } from './pages/artist/artist';
import { Library } from './features/library/pages/library/library';
import { Search } from './pages/search/search';
import { SearchResults } from './pages/search-results/search-results';
import { GenreResults } from './pages/genre-results/genre-results';
import { LikedSongs } from './features/library/pages/liked-songs/liked-songs';
import { Lyrics } from './pages/lyrics/lyrics';
import { Settings } from './pages/settings/settings';

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
      {
        path: 'search/results',
        component: SearchResults,
      },
      {
        path: 'genre/:id',
        component: GenreResults,
      },
      {
        path: 'liked-songs',
        component: LikedSongs,
      },
      {
        path: 'lyrics',
        component: Lyrics,
      },
      {
        path: 'settings',
        component: Settings,
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
