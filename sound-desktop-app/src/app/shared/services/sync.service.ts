import { Injectable, computed, inject, signal } from '@angular/core';
import { LocalMusicService } from '../../media-player/services/local-music.service';

export interface SyncProgress {
  done: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly localMusic = inject(LocalMusicService);

  public readonly syncing = signal(false);
  public readonly syncProgress = signal<SyncProgress | null>(null);
  public readonly syncError = signal<string | null>(null);
  public readonly lastSyncIso = signal<string | null>(null);

  public readonly syncPercent = computed(() => {
    const p = this.syncProgress();
    if (!p) return 0;
    return Math.round((p.done / Math.max(p.total, 1)) * 100);
  });

  public readonly syncedTracks = computed(() => this.syncProgress()?.done ?? 0);

  async runSync(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncError.set(null);

    const folders = this.localMusic.folders();
    if (folders.length === 0) {
      this.syncProgress.set({ done: 0, total: 0 });
      this.syncing.set(false);
      this.lastSyncIso.set(new Date().toISOString());
      return;
    }

    this.syncProgress.set({ done: 0, total: folders.length });
    let completed = 0;

    for (const folder of folders) {
      try {
        await this.localMusic.rescan(folder.id);
        completed += 1;
        this.syncProgress.set({ done: completed, total: folders.length });
      } catch (err) {
        this.syncError.set(`Error sincronizando ${folder.path}`);
      }
    }

    this.lastSyncIso.set(new Date().toISOString());
    this.syncing.set(false);
  }

  skip(): void {
    this.syncing.set(false);
    this.syncProgress.set(null);
    this.syncError.set(null);
  }
}
