import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslationService } from '../../shared/services/translation.service';
import { normalizeText } from '../../shared/utils/text';
import { formatTrackSize, type Track } from '../models/track.model';
import { ArtistImageService } from './artist-image.service';
import {
  genreLabel,
  isGenreId,
  matchGenres,
  withMatchedGenres,
} from '../models/genre-taxonomy';

export interface MusicFolder {
  id: string;
  path: string;
  icon: string;
  badge?: string;
  badgeHiRes?: boolean;
  tracksCount: number | null;
  size: string;
  lastScanIso: string;
  autoSync: boolean;
  online?: boolean;
}

export const LOCAL_FOLDERS_KEY = 'sound.folders';
export const LOCAL_TRACKS_KEY = 'sound.tracks';
export const ARTIST_IDS_KEY = 'sound.artistIds';
export const FOLLOWS_KEY = 'sound.follows';
export const LIKED_TRACKS_KEY = 'sound.likedTracks';

const AUDIO_EXT_RE = /\.(mp3|flac|m4a|mp4|ogg|oga|opus|wav|aiff?|wma|aac|dsf|dff)$/i;

export interface LocalArtist {
  uuid: string;
  name: string;
  trackCount: number;
  albumCount: number;
  totalSec: number;
  genres: string[];
  coverTrack: Track | null;
  lastScanIso: string;
  artistImageUrl: string | null;
}

/** Única normalización de artista (minúsculas + sin diacríticos). */
export function normalizeArtistName(name: string): string {
  return normalizeText(name);
}

export function normalizeArtistNameForApi(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Un género importado sin repetidos, con su conteo de canciones. */
export interface LibraryGenre {
  id: string;
  label: string;
  count: number;
}

/**
 * Migra tracks persistidos sin match (versiones anteriores): conserva ids
 * válidos y rematchea desde el texto raw en caso contrario.
 */
function migrateTrackGenres(t: Partial<Track>): Pick<Track, 'genreId' | 'genreIds'> {
  const rawIds = Array.isArray(t.genreIds) ? t.genreIds.filter(isGenreId) : [];
  const rawId = isGenreId(t.genreId) ? (t.genreId as string) : null;
  const ids = [...new Set([...rawIds, ...(rawId ? [rawId] : [])])];
  if (ids.length > 0) {
    return { genreId: rawId ?? ids[0], genreIds: ids };
  }
  const matched = matchGenres(t.genre);
  return { genreId: matched[0], genreIds: matched };
}

function newUuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `artist-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}



@Injectable({ providedIn: 'root' })
export class LocalMusicService {
  private readonly i18n = inject(TranslationService);
  private readonly artistImageService = inject(ArtistImageService);

  readonly folders = signal<MusicFolder[]>(this.load());
  readonly tracks = signal<Track[]>(this.loadTracks());
  readonly scanning = signal(false);
  readonly scanProgress = signal<{ folderId: string; done: number; total: number } | null>(null);
  readonly scanError = signal<string | null>(null);
  readonly connectedCount = computed(() => this.folders().length);
  readonly recentTracks = computed(() => this.tracks().slice(-8).reverse());
  /**
   * Géneros importados sin repetidos, derivados de los tracks.
   * Fuente única de verdad = sound.tracks, así no se desincroniza ni duplica.
   */
  readonly libraryGenres = computed<LibraryGenre[]>(() => {
    const lang = this.i18n.currentLang();
    const counts = new Map<string, number>();
    for (const t of this.tracks()) {
      const ids = t.genreIds?.length ? t.genreIds : t.genreId ? [t.genreId] : [];
      for (const id of [...new Set(ids)]) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ id, label: genreLabel(id, lang), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  });
  readonly artists = signal<LocalArtist[]>([]);
  readonly follows = signal<string[]>(this.loadFollows());
  readonly likedTrackIds = signal<string[]>(this.loadLiked());
  /** Canciones favoritas (solo ids que aún existen en la librería). */
  readonly likedTracks = computed(() => {
    const liked = new Set(this.likedTrackIds());
    return this.tracks().filter((t) => liked.has(t.id));
  });
  private artistsBuilt = false;

  constructor() {
    // Progreso en vivo enviado por Electron main durante library:scanFolder
    try {
      window.electronAPI?.onScanProgress?.((p) => this.scanProgress.set(p));
    } catch {
      // entorno sin preload: se ignora
    }
    // UUIDs estables por nombre normalizado (persisten entre escaneos)
    effect(() => {
      const names = new Set<string>();
      for (const t of this.tracks()) names.add(normalizeArtistName(t.artist));
      let map: Record<string, string>;
      try {
        map = { ...JSON.parse(localStorage.getItem(ARTIST_IDS_KEY) ?? '{}') };
      } catch {
        map = {};
      }
      let changed = false;
      for (const n of names) {
        if (!map[n]) {
          map[n] = newUuid();
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(ARTIST_IDS_KEY, JSON.stringify(map));
        } catch {
          // Sin almacenamiento: los UUID solo viven en memoria
        }
      }
    });
    this.rebuildArtists();
  }

  private rebuildArtists(): void {
    this.artists.set(this.buildArtists());
    this.artistsBuilt = true;
    this.enrichArtistsWithImages();
  }

  private async enrichArtistsWithImages(): Promise<void> {
    const current = this.artists();
    const missing = current.filter(a => !a.artistImageUrl);
    
    for (const artist of missing) {
      const url = await this.artistImageService.fetchArtistImage(artist.name);
      this.artists.update(list => 
        list.map(a => a.uuid === artist.uuid ? { ...a, artistImageUrl: url } : a)
      );
    }
  }

  artistByUuid(uuid: string): LocalArtist | null {
    return this.artists().find((a) => a.uuid === uuid) ?? null;
  }

  isFollowing(uuid: string): boolean {
    return this.follows().includes(uuid);
  }

  toggleFollow(uuid: string): void {
    this.follows.update((list) =>
      list.includes(uuid) ? list.filter((u) => u !== uuid) : [...list, uuid],
    );
    try {
      localStorage.setItem(FOLLOWS_KEY, JSON.stringify(this.follows()));
    } catch {
      // Sin almacenamiento: solo memoria
    }
  }

  private loadFollows(): string[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(FOLLOWS_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }

  isLiked(trackId: string): boolean {
    return this.likedTrackIds().includes(trackId);
  }

  toggleLike(trackId: string): void {
    this.likedTrackIds.update((list) =>
      list.includes(trackId) ? list.filter((id) => id !== trackId) : [...list, trackId],
    );
    try {
      localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(this.likedTrackIds()));
    } catch {
      // Sin almacenamiento: solo memoria
    }
  }

  private loadLiked(): string[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(LIKED_TRACKS_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  /** Limpia likes huérfanos al eliminar una carpeta. */
  private pruneLikes(folderId: string): void {
    const doomed = new Set(
      this.tracks()
        .filter((t) => t.folderId === folderId)
        .map((t) => t.id),
    );
    if (doomed.size === 0) return;
    const next = this.likedTrackIds().filter((id) => !doomed.has(id));
    if (next.length !== this.likedTrackIds().length) {
      this.likedTrackIds.set(next);
      try {
        localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(next));
      } catch {
        // Sin almacenamiento: solo memoria
      }
    }
  }

  private readUuidMap(): Record<string, string> {
    try {
      const parsed = JSON.parse(localStorage.getItem(ARTIST_IDS_KEY) ?? '{}');
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private buildArtists(): LocalArtist[] {
    const uuidMap = this.readUuidMap();
    const groups = new Map<string, Track[]>();
    for (const t of this.tracks()) {
      const key = normalizeArtistName(t.artist);
      const list = groups.get(key);
      if (list) list.push(t);
      else groups.set(key, [t]);
    }
    const artists: LocalArtist[] = [];
    for (const [key, tracks] of groups) {
      // Casing más frecuente como nombre visible
      const casing = new Map<string, number>();
      for (const t of tracks) {
        const name = t.artist.trim() || key;
        casing.set(name, (casing.get(name) ?? 0) + 1);
      }
      let name = key;
      let best = -1;
      for (const [n, c] of casing) {
        if (c > best) {
          best = c;
          name = n;
        }
      }
      const albums = new Set(tracks.map((t) => t.album.trim().toLowerCase()));
      const genres = [
        ...new Set(
          tracks.flatMap((t) =>
            t.genreIds?.length ? t.genreIds : t.genreId ? [t.genreId] : [],
          ),
        ),
      ];
      const totalSec = tracks.reduce((acc, t) => acc + (t.durationSec ?? 0), 0);
      const coverTrack = tracks.find((t) => !!t.coverCacheKey) ?? tracks[0] ?? null;
      const folderIds = new Set(tracks.map((t) => t.folderId));
      const lastScanIso = this.folders()
        .filter((f) => folderIds.has(f.id))
        .map((f) => f.lastScanIso)
        .sort()
        .at(-1) ?? new Date(0).toISOString();
      artists.push({
        uuid: uuidMap[key] ?? `tmp-${key}`,
        name,
        trackCount: tracks.length,
        albumCount: albums.size,
        totalSec,
        genres,
        coverTrack,
        lastScanIso,
        artistImageUrl: null,
      });
    }
    return artists.sort((a, b) => a.name.localeCompare(b.name));
  }

  private load(): MusicFolder[] {
    try {
      const raw = localStorage.getItem(LOCAL_FOLDERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<MusicFolder>[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (f) =>
            f &&
            typeof f.path === 'string' &&
            typeof f.id === 'string' &&
            // Descarta los mocks antiguos persistidos (ids seed-*)
            !f.id.startsWith('seed-'),
        )
        .map((f) => ({
          id: f.id as string,
          path: f.path as string,
          icon: f.icon ?? 'folder',
          badge: f.badge,
          badgeHiRes: f.badgeHiRes ?? false,
          tracksCount: typeof f.tracksCount === 'number' ? f.tracksCount : null,
          size: f.size ?? '—',
          lastScanIso: f.lastScanIso ?? new Date().toISOString(),
          autoSync: f.autoSync ?? true,
          online: f.online,
        }));
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(this.folders()));
    } catch {
      // Sin almacenamiento: el estado solo vive en memoria
    }
  }

  private loadTracks(): Track[] {
    try {
      const raw = localStorage.getItem(LOCAL_TRACKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<Track>[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((t) => t && typeof t.id === 'string' && typeof t.filePath === 'string')
        .map((t) => ({
          id: t.id as string,
          folderId: typeof t.folderId === 'string' ? t.folderId : 'unknown',
          filePath: t.filePath as string,
          title: typeof t.title === 'string' && t.title ? t.title : 'Pista desconocida',
          artist: typeof t.artist === 'string' && t.artist ? t.artist : 'Artista desconocido',
          album: typeof t.album === 'string' && t.album ? t.album : 'Álbum desconocido',
          genre: typeof t.genre === 'string' ? t.genre : null,
          ...migrateTrackGenres(t),
          year: typeof t.year === 'number' ? t.year : null,
          trackNo: typeof t.trackNo === 'number' ? t.trackNo : null,
          durationSec: typeof t.durationSec === 'number' ? t.durationSec : null,
          format: typeof t.format === 'string' ? t.format : 'AUDIO',
          codec: typeof t.codec === 'string' ? t.codec : null,
          bitrateKbps: typeof t.bitrateKbps === 'number' ? t.bitrateKbps : null,
          sampleRateHz: typeof t.sampleRateHz === 'number' ? t.sampleRateHz : null,
          bitsPerSample: typeof t.bitsPerSample === 'number' ? t.bitsPerSample : null,
          sizeBytes: typeof t.sizeBytes === 'number' ? t.sizeBytes : 0,
          coverCacheKey: typeof t.coverCacheKey === 'string' ? t.coverCacheKey : null,
          hiRes: t.hiRes === true,
          objectUrl: null,
        }));
    } catch {
      return [];
    }
  }

  private persistTracks(): void {
    try {
      // Sin covers base64: solo metadatos + coverCacheKey para no saturar localStorage
      const slim = this.tracks().map(({ objectUrl, ...rest }) => rest);
      localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(slim));
    } catch {
      // cuota excedida: se conserva en memoria
    }
  }

  addFolder(path: string): string | null {
    const clean = path.trim();
    if (!clean) return null;
    const existing = this.folders().find((f) => f.path === clean);
    if (existing) return existing.id;
    const id = `folder-${Date.now()}`;
    this.folders.update((list) => [
      ...list,
      {
        id,
        path: clean,
        icon: clean.startsWith('//') ? 'dns' : 'folder',
        tracksCount: null,
        size: '—',
        lastScanIso: new Date().toISOString(),
        autoSync: true,
      },
    ]);
    this.persist();
    return id;
  }

  removeFolder(id: string): void {
    this.pruneLikes(id);
    this.folders.update((list) => list.filter((f) => f.id !== id));
    this.tracks.update((list) => list.filter((t) => t.folderId !== id));
    this.persist();
    this.persistTracks();
  }

  toggleAutoSync(id: string): void {
    this.folders.update((list) =>
      list.map((f) => (f.id === id ? { ...f, autoSync: !f.autoSync } : f)),
    );
    this.persist();
  }

  /** Reescaneo real vía Electron (music-metadata). Fallback fake solo si no hay preload. */
  async rescan(id?: string): Promise<void> {
    if (this.scanning()) return;
    const api = window.electronAPI;
    if (!api?.scanFolder) {
      // Sin Electron (ng serve web): fake anterior para no romper la UI
      this.scanning.set(true);
      window.setTimeout(() => {
        const now = new Date().toISOString();
        this.folders.update((list) =>
          list.map((f) => (id && f.id !== id ? f : { ...f, lastScanIso: now })),
        );
        this.scanning.set(false);
        this.rebuildArtists();
      }, 1200);
      return;
    }
    const targets = this.folders().filter((f) => !id || f.id === id);
    if (targets.length === 0) return;
    this.scanning.set(true);
    this.scanError.set(null);
    try {
      for (const folder of targets) {
        this.scanProgress.set({ folderId: folder.id, done: 0, total: 1 });
        const result = await api.scanFolder({ folderId: folder.id, dirPath: folder.path });
        const others = this.tracks().filter((t) => t.folderId !== folder.id);
        // Match de géneros contra la taxonomía canónica (persiste en sound.tracks)
        const matched = result.tracks.map((t) => withMatchedGenres(t));
        const merged = [...others, ...matched];
        this.tracks.set(merged);
        this.persistTracks();
        const totalBytes = result.tracks.reduce((acc, t) => acc + (t.sizeBytes || 0), 0);
        const hiResCount = result.tracks.filter((t) => t.hiRes).length;
        this.folders.update((list) =>
          list.map((f) =>
            f.id !== folder.id
              ? f
              : {
                  ...f,
                  tracksCount: result.tracks.length,
                  size: formatTrackSize(totalBytes),
                  lastScanIso: new Date().toISOString(),
                  badge: hiResCount > result.tracks.length / 2 ? 'HI-RES' : f.badge,
                  badgeHiRes: hiResCount > result.tracks.length / 2 ? true : f.badgeHiRes,
                },
          ),
        );
        this.persist();
        if (result.tracks.length === 0) {
          this.scanError.set(`Sin canciones en ${folder.path}. Revisa la ruta y los formatos.`);
        } else if (result.errors > 0) {
          this.scanError.set(`${result.errors} archivos no se pudieron leer y se omitieron.`);
        }
      }
      this.rebuildArtists();
    } catch (err) {
      this.scanError.set(err instanceof Error ? err.message : 'Falló el escaneo de la carpeta.');
    } finally {
      this.scanning.set(false);
      this.scanProgress.set(null);
    }
  }

  /** Fallback web (sin Electron): indexa File[] de <input webkitdirectory> con duración vía <audio>. */
  async indexWebFiles(folderId: string, files: File[]): Promise<void> {
    const audioFiles = files.filter((f) => AUDIO_EXT_RE.test(f.name));
    const mapped = await Promise.all(
      audioFiles.map(async (file) => {
        const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const durationSec = await this.probeWebDuration(file).catch(() => null);
        const ext = (file.name.split('.').pop() || 'AUDIO').toUpperCase();
        return {
          id: `${folderId}::${rel}`,
          folderId,
          filePath: rel,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          artist: 'Artista desconocido',
          album: 'Importación web',
          genre: null,
          ...migrateTrackGenres({ genre: null }),
          year: null,
          trackNo: null,
          durationSec,
          format: ext,
          codec: ext,
          bitrateKbps: null,
          sampleRateHz: null,
          bitsPerSample: null,
          sizeBytes: file.size,
          coverCacheKey: null,
          hiRes: false,
          objectUrl: URL.createObjectURL(file),
        } satisfies Track;
      }),
    );
    const others = this.tracks().filter((t) => t.folderId !== folderId);
    this.tracks.set([...others, ...mapped]);
    this.persistTracks();
    const totalBytes = mapped.reduce((acc, t) => acc + t.sizeBytes, 0);
    this.folders.update((list) =>
      list.map((f) =>
        f.id !== folderId
          ? f
          : { ...f, tracksCount: mapped.length, size: formatTrackSize(totalBytes), lastScanIso: new Date().toISOString() },
      ),
    );
    this.rebuildArtists();
  }

  private probeWebDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const el = new Audio();
        el.preload = 'metadata';
        el.onloadedmetadata = () => {
          const d = Number.isFinite(el.duration) ? Math.round(el.duration) : null;
          URL.revokeObjectURL(url);
          resolve(d);
        };
        el.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        el.src = url;
      } catch {
        resolve(null);
      }
    });
  }

  formatTracks(count: number | null): string {
    if (count === null) return '—';
    const lang = this.i18n.currentLang();
    const num = new Intl.NumberFormat(lang).format(count);
    const unit = this.i18n.translate('import.tracksUnit');
    return `${num} ${unit}`;
  }

  formatLastScan(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.round((then - Date.now()) / 1000);
    const lang = this.i18n.currentLang();
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    return rtf.format(Math.round(diffSec / 86400), 'day');
  }
}
