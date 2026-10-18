import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FavoriteButton } from '../../../../../shared/components/favorite-button/favorite-button';
import {
  LocalArtist,
  LocalMusicService,
  normalizeArtistName,
} from '../../../../services/local-music.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../../../models/track.model';
import { AudioPlayerService } from '../../../../services/audio-player.service';

interface AlbumGroup {
  name: string;
  year: number | null;
  cover: SafeUrl | string;
  trackCount: number;
  kind: 'album' | 'single';
}

@Component({
  selector: 'media-player-artist-profile',
  imports: [RouterLink, TranslatePipe, FavoriteButton],
  templateUrl: './artist-profile.html',
  styleUrl: './artist-profile.css',
})
export class ArtistProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly artistId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly router = inject(Router);
  private readonly library = inject(LocalMusicService);
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly artist = computed<LocalArtist | null>(() => {
    const uuid = this.artistId().get('artistId');
    if (!uuid) return null;
    return this.library.artistByUuid(uuid);
  });

  protected readonly tracks = computed<Track[]>(() => {
    const artist = this.artist();
    if (!artist) return [];
    const key = normalizeArtistName(artist.name);
    return this.library
      .tracks()
      .filter((t) => normalizeArtistName(t.artist) === key)
      .sort((a, b) => (a.trackNo ?? 999) - (b.trackNo ?? 999));
  });

  protected readonly albums = computed<AlbumGroup[]>(() => {
    const byAlbum = new Map<string, Track[]>();
    for (const t of this.tracks()) {
      // Álbum "" no genera pseudo-álbum: se omiten vacíos en la discografía.
      if (!t.album.trim()) continue;
      const key = t.album.trim().toLowerCase();
      const list = byAlbum.get(key);
      if (list) list.push(t);
      else byAlbum.set(key, [t]);
    }
    return [...byAlbum.entries()].map(([key, list]) => {
      const first = list[0];
      const years = list.map((t) => t.year).filter((y): y is number => y !== null);
      return {
        name: first.album,
        year: years.length > 0 ? Math.min(...years) : null,
        cover: this.trackPhoto(first),
        trackCount: list.length,
        kind: (list.length <= 1 ? 'single' : 'album') as 'album' | 'single',
      };
    });
  });

  protected readonly albumFilter = signal<'all' | 'album' | 'single'>('all');

  constructor() {
    effect(() => {
      const uuid = this.artistId().get('artistId');
      if (!uuid) return;
      // Gate: con librería aún vacía o escaneando no se puede dictaminar
      // "inexistente"; la vista inline de notFound cubre el caso real.
      if (this.library.tracks().length === 0 || this.library.scanning()) return;
      if (!this.library.artistByUuid(uuid)) {
        void this.router.navigate(['/not-found']);
      }
    });
  }

  protected readonly visibleAlbums = computed<AlbumGroup[]>(() => {
    const f = this.albumFilter();
    const all = this.albums();
    return f === 'all' ? all : all.filter((a) => a.kind === f);
  });

  protected readonly related = computed<LocalArtist[]>(() => {
    const artist = this.artist();
    if (!artist) return [];
    const genres = new Set(artist.genres.map((g) => g.toLowerCase()));
    return this.library
      .artists()
      .filter((a) => a.uuid !== artist.uuid && a.genres.some((g) => genres.has(g.toLowerCase())))
      .slice(0, 5);
  });

  protected heroPhotoFor(artist: LocalArtist): SafeUrl | string {
    const track = artist.coverTrack;
    if (!track?.coverCacheKey) return '/images/avatar-default.svg';
    const url = coverUrlFor(track, '');
    return url.startsWith('sound-cover:')
      ? this.sanitizer.bypassSecurityTrustUrl(url)
      : url || '/images/avatar-default.svg';
  }

  protected heroPhoto(): SafeUrl | string {
    const artist = this.artist();
    if (!artist) return '/images/avatar-default.svg';
    return this.heroPhotoFor(artist);
  }

  protected trackPhoto(track: Track): SafeUrl | string {
    if (!track.coverCacheKey) return '/images/track-cover.svg';
    const url = coverUrlFor(track, '');
    return url.startsWith('sound-cover:')
      ? this.sanitizer.bypassSecurityTrustUrl(url)
      : url || '/images/track-cover.svg';
  }

  protected onImgError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  protected formatDuration(totalSec: number): string {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  }

  protected formatTrackDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected playAll(): void {
    const list = this.tracks();
    const first = list[0];
    if (first) this.player.playContext(first, list, this.artist()?.name);
  }

  protected playTrack(track: Track): void {
    this.player.playContext(track, this.tracks(), this.artist()?.name);
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }

  protected toggleFollow(): void {
    const artist = this.artist();
    if (artist) this.library.toggleFollow(artist.uuid);
  }

  protected isFollowing(): boolean {
    const artist = this.artist();
    return artist ? this.library.isFollowing(artist.uuid) : false;
  }

  protected toggleLike(trackId: string): void {
    this.library.toggleLike(trackId);
  }

  protected isLiked(trackId: string): boolean {
    return this.library.isLiked(trackId);
  }

  protected goNotFound(): void {
    void this.router.navigate(['/not-found']);
  }
}
