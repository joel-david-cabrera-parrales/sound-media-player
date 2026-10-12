import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TrackContextMenu } from '../../../shared/components/track-context-menu/track-context-menu';
import { AddToPlayListModal } from '../../../shared/components/add-to-playlist-modal/add-to-playlist-modal';
import { TranslationService } from '../../../shared/services/translation.service';
import { TrackMenuService } from '../../../shared/services/track-menu.service';
import { LocalMusicService } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../models/track.model';
import { genreImage } from '../../models/genre-images';
import { DEFAULT_GENRE_COVER, genreLabel, isGenreId } from '../../models/genre-taxonomy';

@Component({
  selector: 'media-player-genre-results',
  imports: [RouterLink, TranslatePipe, TrackContextMenu, AddToPlayListModal],
  templateUrl: './genre-results.html',
  styleUrl: './genre-results.css',
})
export class GenreResults {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  protected readonly menu = inject(TrackMenuService);
  private readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly genreId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly genre = computed<{ id: string; label: string } | null>(() => {
    const id = this.genreId().get('id');
    if (!id || !isGenreId(id)) return null;
    const known = this.library.libraryGenres().some((g) => g.id === id);
    if (!known) return null;
    return { id, label: genreLabel(id, this.i18n.currentLang()) };
  });

  constructor() {
    effect(() => {
      const id = this.genreId().get('id');
      if (!id) return;
      const known =
        isGenreId(id) && this.library.libraryGenres().some((g) => g.id === id);
      if (!known) {
        void this.router.navigate(['/not-found']);
      }
    });
  }

  protected readonly tracks = computed<Track[]>(() => {
    const genre = this.genre();
    if (!genre) return [];
    return this.library
      .tracks()
      .filter((t) => t.genreIds?.includes(genre.id) || t.genreId === genre.id)
      .sort((a, b) => a.title.localeCompare(b.title));
  });

  protected genreCover(): string {
    const genre = this.genre();
    if (!genre) return DEFAULT_GENRE_COVER;
    return genreImage(genre.id);
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(DEFAULT_GENRE_COVER)) img.src = DEFAULT_GENRE_COVER;
  }

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, '/images/track-cover.svg');
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected onTrackImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) img.src = '/images/track-cover.svg';
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected playAll(): void {
    const list = this.tracks();
    if (list.length === 0) return;
    this.player.play(list[0]);
    for (const t of list.slice(1)) this.player.queueNext(t);
  }

  protected playShuffle(): void {
    const list = this.tracks();
    if (list.length === 0) return;
    this.player.play(list[Math.floor(Math.random() * list.length)]);
  }

  protected playTrack(track: Track): void {
    this.player.play(track);
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }

  protected isLiked(track: Track): boolean {
    return this.library.isLiked(track.id);
  }

  protected toggleLike(track: Track, event: Event): void {
    event.stopPropagation();
    this.library.toggleLike(track.id);
  }
}
