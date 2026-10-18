import { Component, input, output, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { normalizeText } from '../../../shared/utils/text';
import { formatTrackDuration, formatTrackSize, type Track } from '../../../media-player/models/track.model';
import { CoverService } from '../../services/cover.service';
import { TrackCard } from '../track-card/track-card';
import { TrackRow } from '../track-row/track-row';
import { EmptyState } from '../empty-state/empty-state';

type SortMode = 'title' | 'artist' | 'album' | 'duration';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'shared-track-list',
  imports: [TranslatePipe, TrackCard, TrackRow, EmptyState],
  templateUrl: './track-list.html',
  styleUrl: './track-list.css',
})
export class TrackList {
  readonly tracks = input.required<Track[]>();
  readonly isLiked = input<(t: Track) => boolean>();
  readonly isCurrent = input<(t: Track) => boolean>();
  readonly emptyTitle = input<string>('');
  readonly emptyDescription = input<string>('');
  readonly emptyCtaLabel = input<string>('');
  readonly emptyCtaLink = input<string>('');
  readonly showPlayAll = input<boolean>(false);
  readonly showStats = input<boolean>(false);
  readonly showSearch = input<boolean>(true);
  readonly showSort = input<boolean>(true);
  readonly showViewToggle = input<boolean>(true);

  readonly trackPlay = output<Track>();
  readonly trackToggleLike = output<Track>();
  readonly trackOpenMenu = output<{ track: Track; event: Event }>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly cover = inject(CoverService);

  protected readonly searchSignal = signal('');
  protected readonly sortSignal = signal<SortMode>('title');
  protected readonly viewSignal = signal<ViewMode>('grid');

  protected readonly formatDuration = formatTrackDuration;
  protected readonly formatSize = formatTrackSize;

  protected readonly filtered = computed<Track[]>(() => {
    const q = normalizeText(this.searchSignal());
    let list = this.tracks();
    if (q) {
      list = list.filter(
        (t) =>
          normalizeText(t.title).includes(q) ||
          normalizeText(t.artist).includes(q) ||
          normalizeText(t.album).includes(q),
      );
    }
    const sorted = [...list];
    switch (this.sortSignal()) {
      case 'artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
        break;
      case 'album':
        sorted.sort((a, b) => a.album.localeCompare(b.album) || (a.trackNo ?? 999) - (b.trackNo ?? 999));
        break;
      case 'duration':
        sorted.sort((a, b) => (b.durationSec ?? -1) - (a.durationSec ?? -1));
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  });

  protected coverFor(track: Track): string | SafeUrl {
    return this.cover.coverFor(track);
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) {
      img.src = '/images/track-cover.svg';
    }
  }

  protected onPlay(track: Track): void {
    this.trackPlay.emit(track);
  }

  protected onToggleLike(track: Track): void {
    this.trackToggleLike.emit(track);
  }

  protected onOpenMenu(track: Track, event: Event): void {
    event.stopPropagation();
    this.trackOpenMenu.emit({ track, event });
  }

  protected setSearch(value: string): void {
    this.searchSignal.set(value);
  }

  protected setSort(mode: SortMode): void {
    this.sortSignal.set(mode);
  }

  protected setView(view: ViewMode): void {
    this.viewSignal.set(view);
  }

  protected readonly search = this.searchSignal.asReadonly();
  protected readonly sort = this.sortSignal.asReadonly();
  protected readonly view = this.viewSignal.asReadonly();
}
