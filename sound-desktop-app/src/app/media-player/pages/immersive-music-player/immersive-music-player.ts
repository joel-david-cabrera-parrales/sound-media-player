import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SoundwaveShader } from '../../components/soundwave-shader/soundwave-shader';

@Component({
  selector: 'media-player-immersive-music-player',
  imports: [RouterLink, TranslatePipe, SoundwaveShader],
  templateUrl: './immersive-music-player.html',
  styleUrl: './immersive-music-player.css',
})
export class ImmersiveMusicPlayer {
  protected readonly coverUrl = '/images/immersive-cover.svg';
  protected readonly trackTitle = 'Espacio sideral';
  protected readonly trackArtist = 'Jesse & Joy';
  protected isFullscreen = false;

  protected async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        this.isFullscreen = false;
      } else {
        await document.documentElement.requestFullscreen();
        this.isFullscreen = true;
      }
    } catch {
      this.isFullscreen = !!document.fullscreenElement;
    }
  }
}
