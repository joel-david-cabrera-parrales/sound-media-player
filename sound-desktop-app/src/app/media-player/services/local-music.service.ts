import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslationService } from '../../shared/services/translation.service';

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

function seedFolders(): MusicFolder[] {
  const now = Date.now();
  return [
    {
      id: 'seed-hires',
      path: 'D:/Music/Hi-Res FLAC & Vinyl Rips',
      icon: 'hard_drive',
      badge: 'FLAC 24-BIT',
      badgeHiRes: true,
      tracksCount: 1420,
      size: '48.6 GB',
      lastScanIso: new Date(now - 12 * 60 * 1000).toISOString(),
      autoSync: true,
    },
    {
      id: 'seed-synth',
      path: 'C:/Users/Alejandro/Music/Synthwave & Electronic',
      icon: 'folder',
      badge: 'ALAC / MP3',
      badgeHiRes: false,
      tracksCount: 856,
      size: '18.2 GB',
      lastScanIso: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      autoSync: true,
    },
    {
      id: 'seed-nas',
      path: '//NAS-SERVER/AudioArchive/Studio Masters',
      icon: 'dns',
      badge: 'DSD / WAV',
      badgeHiRes: true,
      tracksCount: 3120,
      size: '114 GB',
      lastScanIso: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
      autoSync: true,
      online: true,
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class LocalMusicService {
  private readonly i18n = inject(TranslationService);

  readonly folders = signal<MusicFolder[]>(this.load());
  readonly scanning = signal(false);
  readonly connectedCount = computed(() => this.folders().length);

  private load(): MusicFolder[] {
    try {
      const raw = localStorage.getItem(LOCAL_FOLDERS_KEY);
      if (!raw) return seedFolders();
      const parsed = JSON.parse(raw) as Partial<MusicFolder>[];
      if (!Array.isArray(parsed)) return seedFolders();
      return parsed
        .filter((f) => f && typeof f.path === 'string' && typeof f.id === 'string')
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
      return seedFolders();
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(this.folders()));
    } catch {
      // Sin almacenamiento: el estado solo vive en memoria
    }
  }

  addFolder(path: string): void {
    const clean = path.trim();
    if (!clean) return;
    if (this.folders().some((f) => f.path === clean)) return;
    this.folders.update((list) => [
      ...list,
      {
        id: `folder-${Date.now()}`,
        path: clean,
        icon: clean.startsWith('//') ? 'dns' : 'folder',
        tracksCount: null,
        size: '—',
        lastScanIso: new Date().toISOString(),
        autoSync: true,
      },
    ]);
    this.persist();
  }

  removeFolder(id: string): void {
    this.folders.update((list) => list.filter((f) => f.id !== id));
    this.persist();
  }

  toggleAutoSync(id: string): void {
    this.folders.update((list) =>
      list.map((f) => (f.id === id ? { ...f, autoSync: !f.autoSync } : f)),
    );
    this.persist();
  }

  rescan(id?: string): void {
    if (this.scanning()) return;
    this.scanning.set(true);
    window.setTimeout(() => {
      const now = new Date().toISOString();
      this.folders.update((list) =>
        list.map((f) => (id && f.id !== id ? f : { ...f, lastScanIso: now })),
      );
      this.scanning.set(false);
      this.persist();
    }, 1200);
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
