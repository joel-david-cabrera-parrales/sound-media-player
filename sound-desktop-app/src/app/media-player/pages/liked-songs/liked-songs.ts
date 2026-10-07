import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FavoriteButton } from '../../../shared/components/favorite-button/favorite-button';
import { LocalMusicService } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../models/track.model';

@Component({
  selector: 'media-player-liked-songs',
  imports: [RouterLink, TranslatePipe, FavoriteButton],
  templateUrl: './liked-songs.html',
})
export class LikedSongs {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) {
      img.src = '/images/track-cover.svg';
    }
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected playTrack(track: Track): void {
    this.player.play(track);
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }

  protected unlike(track: Track): void {
    this.library.toggleLike(track.id);
  }
}
