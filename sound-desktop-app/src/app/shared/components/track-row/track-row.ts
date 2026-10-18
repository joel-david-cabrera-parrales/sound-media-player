import { Component, input, output } from '@angular/core';
import { formatTrackDuration, formatTrackSize, type Track } from '../../../media-player/models/track.model';
import { TrackCover } from '../track-cover/track-cover';
import { FavoriteButton } from '../favorite-button/favorite-button';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'shared-track-row',
  imports: [TranslatePipe, TrackCover, FavoriteButton],
  templateUrl: './track-row.html',
  styleUrl: './track-row.css',
})
export class TrackRow {
  readonly track = input.required<Track>();
  readonly index = input<number>(0);
  readonly isCurrent = input<boolean>(false);
  readonly isLiked = input<boolean>(false);
  readonly compact = input<boolean>(false);

  readonly playTrack = output<Track>();
  readonly toggleLike = output<Track>();
  readonly openMenu = output<{ track: Track; event: Event }>();

  protected readonly formatDuration = formatTrackDuration;
  protected readonly formatSize = formatTrackSize;

  protected onPlay(event: Event): void {
    event.stopPropagation();
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
