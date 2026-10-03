import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SoundwaveShader } from '../../components/soundwave-shader/soundwave-shader';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor } from '../../models/track.model';

const FALLBACK_COVER = '/images/immersive-cover.svg';
const UNKNOWN_ALBUM = 'Álbum desconocido';

@Component({
  selector: 'media-player-immersive-music-player',
  imports: [RouterLink, TranslatePipe, SoundwaveShader],
  templateUrl: './immersive-music-player.html',
  styleUrl: './immersive-music-player.css',
})
export class ImmersiveMusicPlayer {
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

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
    const track = this.player.currentTrack();
    if (!track) return '';
    if (track.album && track.album !== UNKNOWN_ALBUM) return track.album;
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
}
