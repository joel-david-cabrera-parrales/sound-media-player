import { Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocalMusicService, type LocalArtist } from '../../services/local-music.service';
import { PlaylistsService } from '../../../playlist/services/playlists.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../models/track.model';
import { normalizeText as norm } from '../../../shared/utils/text';

export type ResultsFilter = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export interface AlbumGroup {
  name: string;
  artist: string;
  year: number | null;
  cover: string | SafeUrl;
  tracks: Track[];
  hiRes: boolean;
}

export interface TopResult {
  kind: 'artist' | 'track' | 'album' | 'genre';
  title: string;
  subtitle: string;
  cover: string | SafeUrl;
  track: Track | null;
  artistUuid: string | null;
  stats: string[];
}

/** Distancia Levenshtein (para "quizás quisiste decir"). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur0 = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(prev[j] + 1, cur0 + 1, prev[j - 1] + cost);
      prev[j - 1] = cur0;
      cur0 = next;
    }
    prev[b.length] = cur0;
  }
  return prev[b.length];
}

interface SearchHistoryEntry {
  text: string;
  kind: string;
  refId: string | null;
  ts: number;
}

function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem('sound.searchHistory');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SearchHistoryEntry>[];
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of parsed) {
      if (e && typeof e.text === 'string' && e.text.trim() && !seen.has(e.text)) {
        seen.add(e.text);
        out.push(e.text);
      }
      if (out.length >= 7) break;
    }
    return out;
  } catch {
    return [];
  }
}

@Component({
  selector: 'media-player-search-results',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  protected readonly store = inject(PlaylistsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly q = computed(() => (this.query().get('q') ?? '').trim());

  protected readonly filter = computed<ResultsFilter>(() => {
    const f = (this.query().get('filter') ?? 'all').toLowerCase();
    return f === 'songs' || f === 'artists' || f === 'albums' || f === 'playlists' ? f : 'all';
  });

  protected readonly matchedTracks = computed<Track[]>(() => {
    const q = norm(this.q());
    if (!q) return [];
    return this.library
      .tracks()
      .filter(
        (t) =>
          norm(t.title).includes(q) || norm(t.artist).includes(q) || norm(t.album).includes(q),
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  });

  protected readonly matchedArtists = computed<LocalArtist[]>(() => {
    const q = norm(this.q());
    if (!q) return [];
    return this.library.artists().filter((a) => norm(a.name).includes(q));
  });

  protected readonly matchedAlbums = computed<AlbumGroup[]>(() => {
    const q = norm(this.q());
    if (!q) return [];
    const byAlbum = new Map<string, Track[]>();
    for (const t of this.library.tracks()) {
      if (!norm(t.album).includes(q)) continue;
      const key = `${norm(t.artist)}::${norm(t.album)}`;
      const list = byAlbum.get(key);
      if (list) list.push(t);
      else byAlbum.set(key, [t]);
    }
    return [...byAlbum.values()].map((tracks) => {
      const first = tracks[0];
      const years = tracks.map((t) => t.year).filter((y): y is number => y !== null);
      return {
        name: first.album,
        artist: first.artist,
        year: years.length > 0 ? Math.min(...years) : null,
        cover: this.coverFor(first),
        tracks,
        hiRes: tracks.some((t) => t.hiRes),
      };
    });
  });

  protected readonly matchedGenres = computed<string[]>(() => {
    const q = norm(this.q());
    if (!q) return [];
    const genres = new Set<string>();
    for (const t of this.library.tracks()) {
      const g = t.genre?.trim();
      if (g && norm(g).includes(q)) genres.add(g);
    }
    return [...genres];
  });

  protected readonly topResult = computed<TopResult | null>(() => {
    const q = norm(this.q());
    if (!q) return null;
    const artists = this.library.artists();
    const exactArtist = artists.find((a) => norm(a.name) === q);
    if (exactArtist) {
      const first = this.artistFirstTrack(exactArtist);
      return {
        kind: 'artist',
        title: exactArtist.name,
        subtitle: '',
        cover: this.artistCover(exactArtist),
        track: first,
        artistUuid: exactArtist.uuid,
        stats: [`${exactArtist.trackCount}`, `${exactArtist.albumCount}`],
      };
    }
    const tracks = this.library.tracks();
    const exactTrack = tracks.find((t) => norm(t.title) === q);
    if (exactTrack) {
      return {
        kind: 'track',
        title: exactTrack.title,
        subtitle: `${exactTrack.artist} • ${exactTrack.album}`,
        cover: this.coverFor(exactTrack),
        track: exactTrack,
        artistUuid: null,
        stats: [exactTrack.format, formatTrackDuration(exactTrack.durationSec)],
      };
    }
    const genres = this.matchedGenres();
    if (genres.length > 0) {
      const count = tracks.filter((t) => t.genre?.trim() === genres[0]).length;
      return {
        kind: 'genre',
        title: genres[0],
        subtitle: '',
        cover: '/images/genre-default.svg',
        track: tracks.find((t) => t.genre?.trim() === genres[0]) ?? null,
        artistUuid: null,
        stats: [`${count}`],
      };
    }
    const albums = this.matchedAlbums();
    if (albums.length > 0) {
      const album = albums[0];
      return {
        kind: 'album',
        title: album.name,
        subtitle: album.artist,
        cover: album.cover,
        track: album.tracks[0],
        artistUuid: null,
        stats: [`${album.tracks.length}`],
      };
    }
    const partial = this.matchedTracks()[0];
    if (partial) {
      return {
        kind: 'track',
        title: partial.title,
        subtitle: `${partial.artist} • ${partial.album}`,
        cover: this.coverFor(partial),
        track: partial,
        artistUuid: null,
        stats: [partial.format, formatTrackDuration(partial.durationSec)],
      };
    }
    return null;
  });

  protected readonly showSongs = computed(() => {
    const f = this.filter();
    return f === 'all' || f === 'songs';
  });
  protected readonly showArtists = computed(() => {
    const f = this.filter();
    return f === 'all' || f === 'artists';
  });
  protected readonly showAlbums = computed(() => {
    const f = this.filter();
    return f === 'all' || f === 'albums';
  });
  protected readonly showPlaylists = computed(() => this.filter() === 'all' || this.filter() === 'playlists');

  /** Playlists reales del usuario que coinciden (nombre o descripción). */
  protected readonly matchedPlaylists = computed(() => {
    const q = norm(this.q());
    if (!q) return [];
    return this.store
      .playlists()
      .filter(
        (p) => norm(p.name).includes(q) || norm(p.description).includes(q),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  protected playlistCover(playlistId: string): string | SafeUrl {
    const playlist = this.store.getById(playlistId);
    if (!playlist) return '/images/track-cover.svg';
    if (playlist.coverUrl) {
      const url = playlist.coverUrl;
      if (url.startsWith('sound-photo:') || url.startsWith('data:')) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
      }
      return url;
    }
    const first = this.store
      .resolveTracks(playlist, this.library.tracks())
      .find((t) => !!t.coverCacheKey);
    if (!first) return '/images/track-cover.svg';
    return this.coverFor(first);
  }

  protected playlistTrackCount(playlistId: string): number {
    const playlist = this.store.getById(playlistId);
    if (!playlist) return 0;
    return this.store.resolveTracks(playlist, this.library.tracks()).length;
  }

  protected playPlaylist(playlistId: string, event: Event): void {
    event.stopPropagation();
    const playlist = this.store.getById(playlistId);
    const first = playlist
      ? this.store.resolveTracks(playlist, this.library.tracks())[0]
      : undefined;
    if (first) this.player.play(first);
  }

  /** "Quizás quisiste decir": top-3 reales por parecido (Levenshtein ≤ 0.45). */
  protected readonly suggestions = computed<string[]>(() => {
    const q = norm(this.q());
    if (!q || q.length < 2) return [];
    const candidates = new Map<string, string>();
    for (const t of this.library.tracks()) {
      for (const raw of [t.artist, t.album]) {
        const name = raw.trim();
        if (name) candidates.set(norm(name), name);
      }
      const g = t.genre?.trim();
      if (g) candidates.set(norm(g), g);
    }
    const scored: { label: string; score: number }[] = [];
    for (const [key, label] of candidates) {
      if (key.includes(q)) {
        scored.push({ label, score: 0 });
        continue;
      }
      const d = levenshtein(q, key);
      const score = d / Math.max(q.length, key.length);
      if (score <= 0.45) scored.push({ label, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return [...new Map(scored.map((s) => [norm(s.label), s.label])).values()].slice(0, 3);
  });

  /** Tendencias reales: últimos 4 álbumes por escaneo de carpeta. */
  protected readonly trendingAlbums = computed<AlbumGroup[]>(() => {
    const byAlbum = new Map<string, { tracks: Track[]; lastScan: string }>();
    const folderDate = new Map(this.library.folders().map((f) => [f.id, f.lastScanIso]));
    for (const t of this.library.tracks()) {
      const key = `${norm(t.artist)}::${norm(t.album)}`;
      const entry = byAlbum.get(key);
      const date = folderDate.get(t.folderId) ?? '';
      if (entry) {
        entry.tracks.push(t);
        if (date > entry.lastScan) entry.lastScan = date;
      } else {
        byAlbum.set(key, { tracks: [t], lastScan: date });
      }
    }
    return [...byAlbum.values()]
      .sort((a, b) => b.lastScan.localeCompare(a.lastScan))
      .slice(0, 4)
      .map(({ tracks }) => {
        const first = tracks[0];
        const years = tracks.map((t) => t.year).filter((y): y is number => y !== null);
        return {
          name: first.album,
          artist: first.artist,
          year: years.length > 0 ? Math.min(...years) : null,
          cover: this.coverFor(first),
          tracks,
          hiRes: tracks.some((t) => t.hiRes),
        };
      });
  });

  /** Búsquedas frecuentes reales (historial). */
  protected readonly frequentSearches = computed<string[]>(() => loadSearchHistory());

  protected async rescanAndGoImport(): Promise<void> {
    await this.library.rescan();
    await this.router.navigate(['/library/import-local-files']);
  }

  @ViewChild('rail') private rail?: ElementRef<HTMLElement>;

  protected scrollRail(dir: 1 | -1): void {
    this.rail?.nativeElement.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected artistCover(artist: LocalArtist): string | SafeUrl {
    if (!artist.coverTrack) return '/images/avatar-default.svg';
    const url = coverUrlFor(artist.coverTrack, '');
    if (!url) return '/images/avatar-default.svg';
    return url.startsWith('sound-cover:')
      ? this.sanitizer.bypassSecurityTrustUrl(url)
      : url;
  }

  protected hasArtistCover(artist: LocalArtist): boolean {
    return !!artist.coverTrack?.coverCacheKey;
  }

  protected onImgError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected artistFirstTrack(artist: LocalArtist): Track | null {
    const key = artist.name.trim().toLowerCase();
    return this.library.tracks().find((t) => t.artist.trim().toLowerCase() === key) ?? null;
  }

  protected playTrack(track: Track | null): void {
    if (track) this.player.play(track);
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
}
