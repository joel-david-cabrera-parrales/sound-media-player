import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import {
  PlaylistFormModal,
  type PlaylistFormValue,
} from '../../../shared/components/playlist-form-modal/playlist-form-modal';
import { PlaylistsService } from '../../services/playlists.service';
import type { Playlist } from '../../models/playlist';
import { LocalMusicService } from '../../../media-player/services/local-music.service';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../../media-player/models/track.model';

const PAGE_SIZE = 5;

@Component({
  selector: 'playlist-builder',
  imports: [RouterLink, TranslatePipe, PlaylistFormModal],
  templateUrl: './playlist-builder.html',
  styleUrl: './playlist-builder.css',
})
export class PlaylistBuilder {
  protected readonly store = inject(PlaylistsService);
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly playlistId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly playlist = computed<Playlist | null>(() => {
    const id = this.playlistId().get('id');
    return id ? this.store.getById(id) : null;
  });

  protected readonly search = signal('');
  protected readonly visibleCount = signal(PAGE_SIZE);
  protected readonly editModalOpen = signal(false);

  protected readonly draftCount = computed(() => this.store.draft().entries.length);

  constructor() {
    effect(() => {
      const id = this.playlistId().get('id');
      if (id && !this.store.getById(id)) {
        void this.router.navigate(['/not-found']);
        return;
      }
      this.store.startDraftFor(id);
    });
  }

  protected readonly suggestions = computed<Track[]>(() => {
    const q = this.search().trim().toLowerCase();
    let list = this.library.tracks();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q),
      );
    }
    return list;
  });

  protected readonly visibleSuggestions = computed<Track[]>(() =>
    this.suggestions().slice(0, this.visibleCount()),
  );

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected heroCover(): string | SafeUrl {
    const cover = this.playlist()?.coverUrl;
    if (!cover) return '/images/track-cover.svg';
    if (cover.startsWith('sound-photo:') || cover.startsWith('data:')) {
      return this.sanitizer.bypassSecurityTrustUrl(cover);
    }
    return cover;
  }

  protected onImgError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected isAdded(track: Track): boolean {
    return this.store.draft().entries.some((e) => e.trackId === track.id);
  }

  protected toggleTrack(track: Track): void {
    this.store.toggleDraftTrack(track.id);
  }

  protected playTrack(track: Track): void {
    this.player.play(track);
  }

  protected loadMore(): void {
    this.visibleCount.update((n) => n + PAGE_SIZE);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.visibleCount.set(PAGE_SIZE);
  }

  protected openEdit(): void {
    this.editModalOpen.set(true);
  }

  protected onEditClosed(): void {
    this.editModalOpen.set(false);
  }

  protected onEditSaved(value: PlaylistFormValue): void {
    const id = this.playlistId().get('id');
    if (id) this.store.update(id, value);
    this.editModalOpen.set(false);
  }

  protected async saveAndExit(): Promise<void> {
    const playlist = this.playlist();
    if (!playlist) return;
    this.store.saveBuilder(playlist.id, {
      name: playlist.name,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
    });
    await this.router.navigate(['/playlist']);
  }

  protected readonly editInitial = computed<PlaylistFormValue | null>(() => {
    const playlist = this.playlist();
    if (!playlist) return null;
    return { name: playlist.name, description: playlist.description, coverUrl: playlist.coverUrl };
  });
}
