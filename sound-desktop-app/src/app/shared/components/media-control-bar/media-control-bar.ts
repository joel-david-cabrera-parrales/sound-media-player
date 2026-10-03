import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';
import { coverUrlFor, formatTrackDuration } from '../../../media-player/models/track.model';

@Component({
  selector: 'shared-media-control-bar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './media-control-bar.html',
  styleUrl: './media-control-bar.css',
})
export class MediaControlBar {
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  // Estado vivo del servicio (volumen/mute/repeat/shuffle persisten en localStorage)
  protected readonly isShuffled = this.player.shuffle;
  protected readonly repeatMode = this.player.repeatMode;
  protected readonly isMuted = this.player.muted;
  protected readonly volume = computed(() => Math.round(this.player.volume01() * 100));

  protected readonly isPlaying = this.player.isPlaying;
  protected readonly currentTrack = this.player.currentTrack;
  protected readonly hasTrack = this.player.hasTrack;

  protected readonly elapsedLabel = computed(() => formatTrackDuration(this.player.currentTimeSec()));
  protected readonly durationLabel = computed(() => {
    const live = this.player.durationSec();
    if (live > 0) return formatTrackDuration(live);
    return formatTrackDuration(this.player.currentTrack()?.durationSec);
  });

  /** Carátula de la pista actual (mismo saneado que la tabla de importación). Null = icono por defecto. */
  protected readonly coverUrl = computed<string | SafeUrl | null>(() => {
    const track = this.player.currentTrack();
    if (!track?.coverCacheKey) return null;
    const url = coverUrlFor(track, '');
    if (!url) return null;
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  });

  protected onCoverError(event: Event): void {
    // Si la carátula cacheada falla, se vuelve al icono ocultando el img
    (event.target as HTMLImageElement).style.display = 'none';
  }
  protected readonly progress = computed(() => {
    const dur = this.player.durationSec();
    if (!dur) return 0;
    return Math.min(100, (this.player.currentTimeSec() / dur) * 100);
  });

  // Drag del scrubber: preview mientras arrastras, commit (seekTo) al soltar
  protected readonly seekDragging = signal(false);
  protected readonly seekPreviewRatio = signal(0);
  protected readonly volumeDragging = signal(false);

  /** Progreso mostrado: preview del drag o progreso real. */
  protected readonly displayProgress = computed(() =>
    this.seekDragging() ? this.seekPreviewRatio() * 100 : this.progress(),
  );

  /** Tiempo mostrado: preview del drag o tiempo real. */
  protected readonly displayElapsed = computed(() => {
    if (!this.seekDragging()) return this.elapsedLabel();
    const dur = this.player.durationSec();
    return formatTrackDuration(this.seekPreviewRatio() * (dur > 0 ? dur : 0));
  });

  private ratioFromEvent(event: PointerEvent | MouseEvent): number {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }

  protected onSeekPointerDown(event: PointerEvent): void {
    if (!this.player.hasTrack()) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.seekDragging.set(true);
    this.seekPreviewRatio.set(this.ratioFromEvent(event));
  }

  protected onSeekPointerMove(event: PointerEvent): void {
    if (!this.seekDragging()) return;
    this.seekPreviewRatio.set(this.ratioFromEvent(event));
  }

  protected onSeekPointerUp(event: PointerEvent): void {
    if (!this.seekDragging()) return;
    this.seekDragging.set(false);
    const ratio = this.ratioFromEvent(event);
    const dur = this.player.durationSec();
    if (dur > 0) this.player.seekTo(ratio * dur);
  }

  protected onSeekPointerCancel(): void {
    this.seekDragging.set(false);
  }

  protected onVolumePointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.volumeDragging.set(true);
    // Volumen en vivo durante el drag
    this.player.setVolume01(this.ratioFromEvent(event));
  }

  protected onVolumePointerMove(event: PointerEvent): void {
    if (!this.volumeDragging()) return;
    this.player.setVolume01(this.ratioFromEvent(event));
  }

  protected onVolumePointerUp(): void {
    this.volumeDragging.set(false);
  }

  protected onVolumePointerCancel(): void {
    this.volumeDragging.set(false);
  }

  protected togglePlay(): void {
    this.player.toggle();
  }

  protected nextTrack(): void {
    this.player.next();
  }

  protected previousTrack(): void {
    this.player.previous();
  }

  protected toggleShuffle(): void {
    this.player.toggleShuffle();
  }

  protected cycleRepeat(): void {
    this.player.cycleRepeat();
  }

  protected toggleMute(): void {
    this.player.toggleMute();
  }

}
