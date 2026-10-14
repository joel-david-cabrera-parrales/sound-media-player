import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';
import { SoundwaveShader } from '../../components/soundwave-shader/soundwave-shader';
import { AudioPlayerService } from '../../services/audio-player.service';
import { QueueUiService } from '../../../shared/services/queue-ui.service';
import { coverUrlFor } from '../../models/track.model';

const FALLBACK_COVER = '/images/immersive-cover.svg';

@Component({
  selector: 'media-player-immersive-music-player',
  imports: [RouterLink, TranslatePipe, SoundwaveShader],
  templateUrl: './immersive-music-player.html',
  styleUrl: './immersive-music-player.css',
})
export class ImmersiveMusicPlayer {
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly queueUi = inject(QueueUiService);
  private readonly i18n = inject(TranslationService);

  protected readonly currentTrack = this.player.currentTrack;
  /** Id del track cuya carátula falló (para reintentar al cambiar de canción). */
  protected readonly coverFailedFor = signal<string | null>(null);

  protected readonly coverUrl = computed<string | SafeUrl>(() => {
    const track = this.player.currentTrack();
    if (!track?.coverCacheKey || this.coverFailedFor() === track.id) return FALLBACK_COVER;
    const url = coverUrlFor(track, '');
    if (!url) return FALLBACK_COVER;
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  });

  protected readonly trackTitle = computed(() => this.player.currentTrack()?.title ?? '');
  protected readonly trackArtist = computed(() => this.player.currentTrack()?.artist ?? '');
  /** Álbum real; si no hay, el género. Vacío si no suena nada útil. */
  protected readonly trackAlbum = computed(() => {
    const unknownAlbum = this.i18n.translate('immersive.unknownAlbum');
    const track = this.player.currentTrack();
    if (!track) return '';
    const album = (track.album ?? '').trim();
    if (album && album !== unknownAlbum && album !== 'Álbum desconocido' && album !== 'Unknown album') {
      return track.album;
    }
    return track.genre ?? '';
  });

  protected readonly isFullscreen = signal(false);

  protected onCoverError(): void {
    const id = this.player.currentTrack()?.id;
    if (id) this.coverFailedFor.set(id);
  }

  protected async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        this.isFullscreen.set(false);
      } else {
        await document.documentElement.requestFullscreen();
        this.isFullscreen.set(true);
      }
    } catch {
      this.isFullscreen.set(!!document.fullscreenElement);
    }
  }

  /** Compartir: función mínima real (Web Share API con fallback a portapapeles). */
  protected async shareCurrent(): Promise<void> {
    const track = this.player.currentTrack();
    if (!track) return;
    const text = `${track.title} — ${track.artist}`;
    try {
      const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
      if (typeof nav.share === 'function') {
        await nav.share({ title: track.title, text });
        return;
      }
      throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // portapapeles no disponible: se ignora
      }
    }
  }

  /** Más opciones: función mínima real (abre la cola de reproducción). */
  protected openMore(): void {
    this.queueUi.openDrawer('queue');
  }
}
