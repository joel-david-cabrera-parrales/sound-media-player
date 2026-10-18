import { Component, input, output, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { formatTrackDuration, type Track } from '../../../media-player/models/track.model';
import { TrackCover } from '../track-cover/track-cover';
import { PlayButton } from '../play-button/play-button';
import { FavoriteButton } from '../favorite-button/favorite-button';

@Component({
  selector: 'shared-track-card',
  imports: [TranslatePipe, TrackCover, PlayButton, FavoriteButton],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCard {
  readonly track = input.required<Track>();
  readonly isCurrent = input<boolean>(false);
  readonly isLiked = input<boolean>(false);
  readonly favoriteClass = input<string>('');
  readonly menuClass = input<string>('');

  readonly playTrack = output<Track>();
  readonly toggleLike = output<Track>();
  readonly openMenu = output<{ track: Track; event: Event }>();

  protected readonly formatDuration = formatTrackDuration;

  protected onPlay(): void {
    this.playTrack.emit(this.track());
  }

  protected onToggleLike(): void {
    this.toggleLike.emit(this.track());
  }

  protected onOpenMenu(event: Event): void {
    event.stopPropagation();
    this.openMenu.emit({ track: this.track(), event });
  }
}
