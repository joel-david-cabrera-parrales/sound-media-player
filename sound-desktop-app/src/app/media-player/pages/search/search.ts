import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';
import { LocalMusicService } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, type Track } from '../../models/track.model';
import { genreImage } from '../../models/genre-images';
import { DEFAULT_GENRE_COVER } from '../../models/genre-taxonomy';

type SearchFilter = 'all' | 'music' | 'podcasts' | 'live';
type GenreSort = 'popular' | 'az';
type HistoryKind = 'track' | 'artist' | 'genre';

interface SearchHistoryEntry {
  text: string;
  kind: HistoryKind;
  refId: string | null;
  ts: number;
}

interface GenreCardVM {
  id: string;
  label: string;
  count: number;
  bg: string;
  glow: string;
  tint: string;
  cover: string | SafeUrl;
}

interface ResultItem {
  kind: HistoryKind;
  label: string;
  sub: string;
  track: Track | null;
  artistName: string | null;
  genreId: string | null;
  cover: string | SafeUrl;
}

const SEARCH_HISTORY_KEY = 'sound.searchHistory';
const HISTORY_MAX = 8;

// 12 paletas espejo del diseño (fondo + glow + tinte del badge)
const GENRE_PALETTES = [
  { bg: 'from-cyan-500 via-sky-600 to-blue-900', glow: 'hover:shadow-cyan-500/20', tint: 'text-cyan-200' },
  { bg: 'from-fuchsia-600 via-purple-700 to-sky-700', glow: 'hover:shadow-fuchsia-500/20', tint: 'text-fuchsia-200' },
  { bg: 'from-pink-500 via-rose-600 to-purple-900', glow: 'hover:shadow-pink-500/20', tint: 'text-pink-200' },
  { bg: 'from-red-600 via-red-900 to-neutral-950', glow: 'hover:shadow-red-600/20', tint: 'text-red-200' },
  { bg: 'from-amber-500 via-orange-600 to-stone-900', glow: 'hover:shadow-amber-500/20', tint: 'text-amber-200' },
  { bg: 'from-emerald-500 via-teal-700 to-slate-900', glow: 'hover:shadow-emerald-500/20', tint: 'text-emerald-200' },
  { bg: 'from-orange-500 via-amber-700 to-yellow-950', glow: 'hover:shadow-orange-500/20', tint: 'text-orange-200' },
  { bg: 'from-zinc-500 via-zinc-700 to-neutral-950', glow: 'hover:shadow-zinc-500/20', tint: 'text-zinc-200' },
  { bg: 'from-blue-500 via-indigo-700 to-slate-950', glow: 'hover:shadow-blue-500/20', tint: 'text-blue-200' },
  { bg: 'from-indigo-500 via-violet-700 to-purple-950', glow: 'hover:shadow-indigo-500/20', tint: 'text-indigo-200' },
  { bg: 'from-violet-600 via-purple-800 to-indigo-950', glow: 'hover:shadow-violet-500/20', tint: 'text-violet-200' },
  { bg: 'from-green-500 via-emerald-700 to-teal-950', glow: 'hover:shadow-green-500/20', tint: 'text-green-200' },
];

function paletteFor(id: string): (typeof GENRE_PALETTES)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GENRE_PALETTES[h % GENRE_PALETTES.length];
}

function loadHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SearchHistoryEntry>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.text === 'string' && (e.kind === 'track' || e.kind === 'artist' || e.kind === 'genre'))
      .map((e) => ({
        text: e.text as string,
        kind: e.kind as HistoryKind,
        refId: typeof e.refId === 'string' ? e.refId : null,
        ts: typeof e.ts === 'number' ? e.ts : 0,
      }))
      .slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

@Component({
  selector: 'media-player-search',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './search.html',
})
export class Search {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly i18n = inject(TranslationService);

  protected readonly query = signal('');
  protected readonly activeFilter = signal<SearchFilter>('all');
  protected readonly genreSort = signal<GenreSort>('popular');
  protected readonly selectedGenreId = signal<string | null>(null);
  protected readonly history = signal<SearchHistoryEntry[]>(loadHistory());

  /** Tarjetas de "Explorar todo" desde los géneros importados (sin repetidos). */
  protected readonly genreCards = computed<GenreCardVM[]>(() => {
    const lang = this.i18n.currentLang();
    void lang;
    const cards = this.library.libraryGenres().map((g) => {
      const palette = paletteFor(g.id);
      return {
        id: g.id,
        label: g.label,
        count: g.count,
        bg: palette.bg,
        glow: palette.glow,
        tint: palette.tint,
        cover: this.genreCover(g.id),
      };
    });
    if (this.genreSort() === 'az') {
      cards.sort((a, b) => a.label.localeCompare(b.label));
    }
    return cards;
  });

  /** Resultados en vivo (canciones + artistas + géneros importados). */
  protected readonly results = computed<ResultItem[]>(() => {
    const filter = this.activeFilter();
    if (filter === 'podcasts' || filter === 'live') return [];
    const q = this.query().trim().toLowerCase();
    const sel = this.selectedGenreId();
    let tracks = this.library.tracks();
    if (sel) {
      tracks = tracks.filter((t) => t.genreIds?.includes(sel) || t.genreId === sel);
    }
    const out: ResultItem[] = [];
    if (q) {
      if (filter === 'all' || filter === 'music') {
        for (const t of tracks) {
          if (
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.album.toLowerCase().includes(q)
          ) {
            out.push({
              kind: 'track',
              label: t.title,
              sub: `${t.artist} • ${t.album}`,
              track: t,
              artistName: null,
              genreId: null,
              cover: this.coverFor(t),
            });
            if (out.length >= 5) break;
          }
        }
      }
      if (filter === 'all') {
        for (const a of this.library.artists()) {
          if (a.name.toLowerCase().includes(q)) {
            out.push({
              kind: 'artist',
              label: a.name,
              sub: this.i18n.translate('search.typeArtist'),
              track: null,
              artistName: a.name,
              genreId: null,
              cover: a.coverTrack ? this.coverFor(a.coverTrack) : '/images/track-cover.svg',
            });
            if (out.length >= 8) break;
          }
        }
        for (const g of this.library.libraryGenres()) {
          if (g.label.toLowerCase().includes(q)) {
            out.push({
              kind: 'genre',
              label: g.label,
              sub: this.i18n.translate('search.typeGenre'),
              track: null,
              artistName: null,
              genreId: g.id,
              cover: this.genreCover(g.id),
            });
            if (out.length >= 10) break;
          }
        }
      }
    } else if (sel) {
      for (const t of tracks.slice(0, 8)) {
        out.push({
          kind: 'track',
          label: t.title,
          sub: `${t.artist} • ${t.album}`,
          track: t,
          artistName: null,
          genreId: null,
          cover: this.coverFor(t),
        });
      }
    }
    return out;
  });

  protected readonly hasLibrary = computed(() => this.library.tracks().length > 0);

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  protected setFilter(filter: SearchFilter): void {
    this.activeFilter.set(filter);
  }

  protected setGenreSort(mode: GenreSort): void {
    this.genreSort.set(mode);
  }

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  /**
   * Imagen de la tarjeta: la del género en public/genres-images
   * (match por id + relaciones), con fallback a la imagen por defecto.
   */
  protected genreCover(genreId: string): string {
    return genreImage(genreId);
  }

  protected onGenreImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/genre-default.svg')) {
      img.src = DEFAULT_GENRE_COVER;
    }
  }

  protected typeLabel(kind: HistoryKind): string {
    if (kind === 'artist') return this.i18n.translate('search.typeArtist');
    if (kind === 'genre') return this.i18n.translate('search.typeGenre');
    return this.i18n.translate('search.typeTrack');
  }

  protected songsCountLabel(count: number): string {
    return this.i18n.translate('search.songsCount', { count });
  }

  protected playTrack(track: Track): void {
    this.player.play(track);
    this.remember({ text: track.title, kind: 'track', refId: track.id });
  }

  protected playGenre(genreId: string, label: string): void {
    const first = this.library
      .tracks()
      .find((t) => t.genreIds?.includes(genreId) || t.genreId === genreId);
    if (!first) return;
    this.player.play(first);
    this.remember({ text: label, kind: 'genre', refId: genreId });
  }

  protected selectArtist(name: string): void {
    this.query.set(name);
    this.remember({ text: name, kind: 'artist', refId: null });
  }

  protected openGenre(genreId: string, label: string): void {
    this.selectedGenreId.set(this.selectedGenreId() === genreId ? null : genreId);
    this.remember({ text: label, kind: 'genre', refId: genreId });
    // TODO fase 2 (redirección): router.navigate(['/media-player/library'], { queryParams: { genre: genreId } })
  }

  protected clearGenreFilter(): void {
    this.selectedGenreId.set(null);
  }

  protected openHistory(entry: SearchHistoryEntry): void {
    if (entry.kind === 'track' && entry.refId) {
      const track = this.library.tracks().find((t) => t.id === entry.refId);
      if (track) {
        this.player.play(track);
        return;
      }
      this.removeHistory(entry);
      return;
    }
    if (entry.kind === 'artist') {
      this.query.set(entry.text);
      return;
    }
    if (entry.kind === 'genre' && entry.refId) {
      this.selectedGenreId.set(entry.refId);
    }
  }

  protected removeHistory(entry: SearchHistoryEntry): void {
    this.history.update((list) =>
      list.filter((e) => !(e.text === entry.text && e.kind === entry.kind && e.refId === entry.refId)),
    );
    this.persistHistory();
  }

  protected clearHistory(): void {
    this.history.set([]);
    this.persistHistory();
  }

  private remember(entry: Omit<SearchHistoryEntry, 'ts'>): void {
    this.history.update((list) => {
      const next = [
        { ...entry, ts: Date.now() },
        ...list.filter((e) => !(e.text === entry.text && e.kind === entry.kind)),
      ];
      return next.slice(0, HISTORY_MAX);
    });
    this.persistHistory();
  }

  private persistHistory(): void {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.history()));
    } catch {
      // Sin almacenamiento: el historial solo vive en memoria
    }
  }
}
