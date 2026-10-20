import { Component, OnDestroy, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocalMusicService, type MusicFolder } from '../../../media-player/services/local-music.service';
import { SyncService } from '../../../shared/services/sync.service';

@Component({
  selector: 'welcome-general-setup',
  imports: [TranslatePipe],
  templateUrl: './general-setup.html',
  styleUrl: './general-setup.css',
})
export class GeneralSetup implements OnDestroy {
  private readonly router = inject(Router);
  private readonly localMusic = inject(LocalMusicService);
  private readonly sync = inject(SyncService);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly api = (window as unknown as { electronAPI?: {
    scanFolder: (input: { folderId: string; dirPath: string }) => Promise<any>;
    onScanProgress: (cb: (payload: any) => void) => () => void;
  } | undefined }).electronAPI;

  protected readonly folders = this.localMusic.folders;

  protected readonly syncing = this.sync.syncing;
  protected readonly syncProgress = this.sync.syncProgress;
  protected readonly syncError = this.sync.syncError;
  protected readonly syncPercent = this.sync.syncPercent;
  protected readonly syncedTracks = this.sync.syncedTracks;

  protected readonly scanning = signal(false);
  protected readonly scanProgress = signal<{ folderId: string; done: number; total: number } | null>(null);
  protected readonly scannedTracks = signal(0);

  protected readonly scanPercentLocal = computed(() => {
    const p = this.scanProgress();
    if (!p) return 0;
    return Math.round((p.done / Math.max(p.total, 1)) * 100);
  });

  constructor() {
    this.startSync();
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private async startSync(): Promise<void> {
    await this.sync.runSync();
    this.navigateToLibrary();
  }

  protected navigateToLibrary(): void {
    this.router.navigate(['/media-player']);
  }

  public skipScan(): void {
    this.sync.skip();
    if (this.timer) clearTimeout(this.timer);
    this.navigateToLibrary();
  }
}
