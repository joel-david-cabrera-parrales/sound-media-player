import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AudioPlayerService } from '../../../../services/audio-player.service';
import { coverUrlFor } from '../../../../models/track.model';
import type { Track } from '../../../../models/track.model';

@Component({
  selector: 'media-player-lyrics',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './lyrics.html',
  styleUrl: './lyrics.css',
})
export class Lyrics {
  protected readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly currentTrack = this.player.currentTrack;

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
}
