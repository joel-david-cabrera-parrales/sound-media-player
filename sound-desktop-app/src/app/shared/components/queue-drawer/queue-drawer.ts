import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';
import { QueueUiService, type QueueTab } from '../../services/queue-ui.service';
import {
  coverUrlFor,
  formatTrackDuration,
  type Track,
} from '../../../media-player/models/track.model';

@Component({
  selector: 'shared-queue-drawer',
  imports: [TranslatePipe],
  templateUrl: './queue-drawer.html',
  styleUrl: './queue-drawer.css',
})
export class QueueDrawer {
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly ui = inject(QueueUiService);

  protected readonly currentTrack = this.player.currentTrack;
  protected readonly isPlaying = this.player.isPlaying;
  protected readonly contextLabel = this.player.contextLabel;
  protected readonly queueCount = computed(() => this.player.upNext().length);

  /** Cola manual; si está vacía se muestra lo que sigue del contexto de página. */
  protected readonly isManual = computed(() => this.player.upNext().length > 0);

  protected readonly upcoming = computed<Track[]>(() => {
    const ctx = this.player.contextQueue();
    const cur = this.player.currentTrack();
    if (!cur) return ctx;
    const idx = ctx.findIndex((t) => t.id === cur.id);
    return idx < 0 ? ctx : ctx.slice(idx + 1);
  });

  protected readonly queueItems = computed<Track[]>(() => {
    const manual = this.player.upNext();
    return manual.length > 0 ? manual : this.upcoming();
  });

  protected readonly historyTracks = this.player.history;

  private readonly dragIndex = signal<number | null>(null);

  protected close(): void {
    this.ui.closeDrawer();
  }

  protected setTab(tab: QueueTab): void {
    this.ui.setTab(tab);
  }

  protected togglePlay(): void {
    this.player.toggle();
  }

  protected playItem(track: Track, index: number): void {
    if (this.isManual()) this.player.playQueuedAt(index);
    else this.player.play(track);
  }

  protected playHistoryTrack(track: Track): void {
    this.player.play(track);
  }

  protected removeItem(trackId: string, event: Event): void {
    event.stopPropagation();
    this.player.removeFromQueue(trackId);
  }

  protected clearQueue(): void {
    this.player.clearQueue();
  }

  protected clearHistory(): void {
    this.player.clearHistory();
  }

  protected onDragStart(index: number, event: DragEvent): void {
    if (!this.isManual()) {
      event.preventDefault();
      return;
    }
    this.dragIndex.set(index);
    try {
      event.dataTransfer?.setData('text/plain', String(index));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    } catch {
      // DnD no disponible: se ignora
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (this.dragIndex() == null) return;
    event.preventDefault();
  }

  protected onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragIndex();
    this.dragIndex.set(null);
    if (from == null || from === index) return;
    this.player.moveInQueue(from, index);
  }

  protected onDragEnd(): void {
    this.dragIndex.set(null);
  }

  protected isDragging(index: number): boolean {
    return this.dragIndex() === index;
  }

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) img.src = '/images/track-cover.svg';
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
