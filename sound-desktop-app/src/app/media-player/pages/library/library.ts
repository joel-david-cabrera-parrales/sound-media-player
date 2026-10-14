import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FavoriteButton } from '../../../shared/components/favorite-button/favorite-button';
import { TrackContextMenu } from '../../../shared/components/track-context-menu/track-context-menu';
import { AddToPlayListModal } from '../../../shared/components/add-to-playlist-modal/add-to-playlist-modal';
import {
  PlaylistFormModal,
  type PlaylistFormValue,
} from '../../../shared/components/playlist-form-modal/playlist-form-modal';
import { TrackMenuService } from '../../../shared/services/track-menu.service';
import { PlaylistsService } from '../../../playlist/services/playlists.service';
import { LocalMusicService } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { formatTrackDuration, formatTrackSize, type Track } from '../../models/track.model';
import { trackCoverCached } from '../../../shared/utils/cover-cache';
import { normalizeText } from '../../../shared/utils/text';

type SortMode = 'title' | 'artist' | 'album' | 'duration';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'media-player-library',
  imports: [RouterLink, TranslatePipe, FavoriteButton, TrackContextMenu, AddToPlayListModal, PlaylistFormModal],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  protected readonly menu = inject(TrackMenuService);
  protected readonly store = inject(PlaylistsService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly search = signal('');
  protected readonly sort = signal<SortMode>('title');
  protected readonly view = signal<ViewMode>('grid');
  protected readonly showCreate = signal(false);

  protected readonly filtered = computed<Track[]>(() => {
    const q = normalizeText(this.search());
    let list = this.library.tracks();
    if (q) {
      list = list.filter(
        (t) =>
          normalizeText(t.title).includes(q) ||
          normalizeText(t.artist).includes(q) ||
          normalizeText(t.album).includes(q),
      );
    }
    const sorted = [...list];
    switch (this.sort()) {
      case 'artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
        break;
      case 'album':
        sorted.sort((a, b) => a.album.localeCompare(b.album) || (a.trackNo ?? 999) - (b.trackNo ?? 999));
        break;
      case 'duration':
        sorted.sort((a, b) => (b.durationSec ?? -1) - (a.durationSec ?? -1));
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  });

  protected readonly albumCount = computed(() => {
    const albums = new Set(
      this.library.tracks().map((t) => `${t.artist.trim().toLowerCase()}::${t.album.trim().toLowerCase()}`),
    );
    return albums.size;
  });

  protected readonly totalSize = computed(() =>
    formatTrackSize(this.library.tracks().reduce((acc, t) => acc + t.sizeBytes, 0)),
  );

  protected readonly mosaic = computed<(string | SafeUrl)[]>(() =>
    this.library
      .tracks()
      .filter((t) => !!t.coverCacheKey)
      .slice(0, 4)
      .map((t) => this.coverFor(t)),
  );

  protected coverFor(track: Track): string | SafeUrl {
    return trackCoverCached(this.sanitizer, track, '/images/track-cover.svg');
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) {
      img.src = '/images/track-cover.svg';
    }
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected formatSize(bytes: number): string {
    return formatTrackSize(bytes);
  }

  protected playTrack(track: Track): void {
    this.player.playContext(track, this.filtered());
  }

  protected isLiked(track: Track): boolean {
    return this.library.isLiked(track.id);
  }

  protected toggleLike(track: Track): void {
    this.library.toggleLike(track.id);
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }

  protected setSort(mode: SortMode): void {
    this.sort.set(mode);
  }

  protected setView(view: ViewMode): void {
    this.view.set(view);
  }

  protected async onCreateSaved(value: PlaylistFormValue): Promise<void> {
    const created = this.store.create(value);
    this.showCreate.set(false);
    await this.router.navigate(['/playlist', created.id, 'edit']);
  }
}
