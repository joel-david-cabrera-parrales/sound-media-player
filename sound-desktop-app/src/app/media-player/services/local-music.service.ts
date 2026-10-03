import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslationService } from '../../shared/services/translation.service';
import { formatTrackSize, type Track } from '../models/track.model';

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

const AUDIO_EXT_RE = /\.(mp3|flac|m4a|mp4|ogg|oga|opus|wav|aiff?|wma|aac|dsf|dff)$/i;



@Injectable({ providedIn: 'root' })
export class LocalMusicService {
  private readonly i18n = inject(TranslationService);

  readonly folders = signal<MusicFolder[]>(this.load());
  readonly tracks = signal<Track[]>(this.loadTracks());
  readonly scanning = signal(false);
  readonly scanProgress = signal<{ folderId: string; done: number; total: number } | null>(null);
  readonly scanError = signal<string | null>(null);
  readonly connectedCount = computed(() => this.folders().length);
  readonly recentTracks = computed(() => this.tracks().slice(-8).reverse());

  constructor() {
    // Progreso en vivo enviado por Electron main durante library:scanFolder
    try {
      window.electronAPI?.onScanProgress?.((p) => this.scanProgress.set(p));
    } catch {
      // entorno sin preload: se ignora
    }
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
        this.persist();
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
        const merged = [...others, ...result.tracks];
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
    this.persist();
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
