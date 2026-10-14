import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { PlaylistsService } from '../../services/playlists.service';
import type { Playlist } from '../../models/playlist';
import { LocalMusicService } from '../../../media-player/services/local-music.service';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';
import { formatTrackDuration, type Track } from '../../../media-player/models/track.model';
import { safeUrlCached, trackCoverCached } from '../../../shared/utils/cover-cache';

type DetailSort = 'added' | 'title' | 'artist' | 'duration';

interface DetailRow {
  track: Track;
  addedAt: string;
}

@Component({
  selector: 'playlist-detail',
  imports: [RouterLink, TranslatePipe, RelativeTimePipe],
  templateUrl: './playlist-detail.html',
  styleUrl: './playlist-detail.css',
})
export class PlaylistDetail {
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
  protected readonly sort = signal<DetailSort>('added');

  constructor() {
    effect(() => {
      const id = this.playlistId().get('id');
      if (id && !this.store.getById(id)) {
        void this.router.navigate(['/not-found']);
      }
    });
  }

  protected readonly rows = computed<DetailRow[]>(() => {
    const playlist = this.playlist();
    if (!playlist) return [];
    const q = this.search().trim().toLowerCase();
    let rows = this.store
      .resolveEntries(playlist, this.library.tracks())
      .map(({ track, addedAt }) => ({ track, addedAt }));
    if (q) {
      rows = rows.filter(
        (r) =>
          r.track.title.toLowerCase().includes(q) ||
          r.track.artist.toLowerCase().includes(q) ||
          r.track.album.toLowerCase().includes(q),
      );
    }
    const sorted = [...rows];
    switch (this.sort()) {
      case 'title':
        sorted.sort((a, b) => a.track.title.localeCompare(b.track.title));
        break;
      case 'artist':
        sorted.sort((a, b) => a.track.artist.localeCompare(b.track.artist));
        break;
      case 'duration':
        sorted.sort((a, b) => (b.track.durationSec ?? -1) - (a.track.durationSec ?? -1));
        break;
      default:
        sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    }
    return sorted;
  });

  protected readonly totalSec = computed(() =>
    this.rows().reduce((acc, r) => acc + (r.track.durationSec ?? 0), 0),
  );

  protected readonly related = computed<Playlist[]>(() => {
    const playlist = this.playlist();
    if (!playlist) return [];
    const mine = new Set(
      this.store.resolveTracks(playlist, this.library.tracks()).map((t) => t.id),
    );
    return this.store
      .playlists()
      .filter((p) => p.id !== playlist.id)
      .map((p) => ({
        playlist: p,
        overlap: this.store.resolveTracks(p, this.library.tracks()).filter((t) => mine.has(t.id)).length,
      }))
      .filter((r) => r.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 4)
      .map((r) => r.playlist);
  });

  /** Conteos memoizados por playlist id (evita resolveTracks por CD en el template). */
  protected readonly relatedCounts = computed<Record<string, number>>(() => {
    const all = this.library.tracks();
    const out: Record<string, number> = {};
    for (const p of this.store.playlists()) {
      out[p.id] = this.store.resolveTracks(p, all).length;
    }
    return out;
  });

  protected heroCover(): string | SafeUrl {
    const cover = this.playlist()?.coverUrl;
    if (cover) {
      if (cover.startsWith('sound-photo:') || cover.startsWith('data:') || cover.startsWith('sound-cover:')) {
        return safeUrlCached(this.sanitizer, cover);
      }
      return cover;
    }
    const first = this.rows().find((r) => r.track.coverCacheKey)?.track ?? this.rows()[0]?.track;
    if (!first) return '/images/track-cover.svg';
    return this.coverFor(first);
  }

  protected coverFor(track: Track): string | SafeUrl {
    return trackCoverCached(this.sanitizer, track, '/images/track-cover.svg');
  }

  protected onImgError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected formatTotal(totalSec: number): string {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  }

  protected relatedCover(playlist: Playlist): string | SafeUrl {
    const first = this.store
      .resolveTracks(playlist, this.library.tracks())
      .find((t) => !!t.coverCacheKey);
    if (!first) return '/images/track-cover.svg';
    return this.coverFor(first);
  }

  protected relatedCount(playlist: Playlist): number {
    return this.relatedCounts()[playlist.id] ?? this.store.resolveTracks(playlist, this.library.tracks()).length;
  }

  protected playAll(): void {
    const rows = this.rows();
    const first = rows[0]?.track;
    if (first) this.player.playContext(first, rows.map((r) => r.track), this.playlist()?.name);
  }

  protected playTrack(track: Track): void {
    this.player.playContext(track, this.rows().map((r) => r.track), this.playlist()?.name);
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }

  protected toggleLike(track: Track, event: Event): void {
    event.stopPropagation();
    this.library.toggleLike(track.id);
  }

  protected isLiked(track: Track): boolean {
    return this.library.isLiked(track.id);
  }

  protected togglePlaylistLike(): void {
    const playlist = this.playlist();
    if (playlist) this.store.togglePlaylistLike(playlist.id);
  }

  protected isPlaylistLiked(): boolean {
    const playlist = this.playlist();
    return playlist ? this.store.isPlaylistLiked(playlist.id) : false;
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }

  protected setSort(mode: DetailSort): void {
    this.sort.set(mode);
  }
}
