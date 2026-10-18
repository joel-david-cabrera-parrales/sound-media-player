import { Component, OnDestroy, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocalMusicService, type MusicFolder } from '../../../media-player/services/local-music.service';

@Component({
  selector: 'welcome-general-setup',
  imports: [TranslatePipe],
  templateUrl: './general-setup.html',
  styleUrl: './general-setup.css',
})
export class GeneralSetup implements OnDestroy {
  private readonly router = inject(Router);
  private readonly localMusic = inject(LocalMusicService);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly api = (window as unknown as { electronAPI?: {
    scanFolder: (input: { folderId: string; dirPath: string }) => Promise<any>;
    onScanProgress: (cb: (payload: any) => void) => () => void;
  } | undefined }).electronAPI;

  protected readonly scanning = signal(false);
  protected readonly scanProgress = signal<{ folderId: string; done: number; total: number } | null>(null);
  protected readonly scannedTracks = signal(0);
  protected readonly scanError = signal<string | null>(null);
  protected readonly folders = this.localMusic.folders;

  protected readonly scanPercent = computed(() => {
    const p = this.scanProgress();
    if (!p) return 0;
    return Math.round((p.done / Math.max(p.total, 1)) * 100);
  });

  constructor() {
    this.startScan();
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private startScan(): void {
    const folderList = this.folders();
    const hasElectron = !!this.api?.scanFolder;

    if (!hasElectron || folderList.length === 0) {
      // Sin Electron o sin carpetas: navegación directa tras breve pausa
      this.timer = setTimeout(() => this.navigateToLibrary(), 1500);
      return;
    }

    this.scanning.set(true);
    this.scanFolders(folderList);
  }

  private async scanFolders(folders: MusicFolder[]): Promise<void> {
    let totalTracks = 0;

    for (const folder of folders) {
      this.scanProgress.set({ folderId: folder.id, done: 0, total: 1 });

      try {
        const result = await this.api!.scanFolder({ folderId: folder.id, dirPath: folder.path });
        const tracks = result.tracks || [];
        totalTracks += tracks.length;

        this.scanProgress.set({ folderId: folder.id, done: tracks.length, total: tracks.length });
        this.scannedTracks.set(totalTracks);
      } catch (err) {
        this.scanError.set(folder.path);
        console.error('[general-setup] Error escaneando carpeta:', folder.path, err);
      }
    }

    this.scanning.set(false);
    this.timer = setTimeout(() => this.navigateToLibrary(), 800);
  }

  protected navigateToLibrary(): void {
    this.router.navigate(['/media-player']);
  }

  protected skipScan(): void {
    if (this.timer) clearTimeout(this.timer);
    this.navigateToLibrary();
  }
}
