import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-media-control-bar',
  imports: [TranslatePipe],
  templateUrl: './media-control-bar.html',
  styleUrl: './media-control-bar.css',
})
export class MediaControlBar {
  protected readonly isPlaying = signal(false);
  protected readonly isShuffled = signal(false);
  protected readonly repeatMode = signal<0 | 1 | 2>(0);
  protected readonly isMuted = signal(false);
  protected readonly volume = signal(75);
  protected readonly progress = signal(0);

  protected togglePlay(): void {
    this.isPlaying.update((v) => !v);
  }

  protected toggleShuffle(): void {
    this.isShuffled.update((v) => !v);
  }

  protected cycleRepeat(): void {
    this.repeatMode.update((v) => ((v + 1) % 3) as 0 | 1 | 2);
  }

  protected toggleMute(): void {
    this.isMuted.update((v) => !v);
  }

  protected setVolume(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.volume.set(Math.round(ratio * 100));
    if (ratio > 0) this.isMuted.set(false);
  }

  protected seek(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.progress.set(Math.round(ratio * 100));
  }
}
