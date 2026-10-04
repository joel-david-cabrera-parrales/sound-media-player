import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import {
  LocalArtist,
  LocalMusicService,
} from '../../services/local-music.service';
import { coverUrlFor } from '../../models/track.model';
import { AudioPlayerService } from '../../services/audio-player.service';

type SortMode = 'name' | 'tracks' | 'recent';
type ViewMode = 'grid' | 'list';

const LETTERS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ#'.split('');

@Component({
  selector: 'media-player-artist',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './artist.html',
  styleUrl: './artist.css',
})
export class Artist {
  protected readonly library = inject(LocalMusicService);
  private readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly search = signal('');
  protected readonly letter = signal<string>('all');
  protected readonly sort = signal<SortMode>('name');
  protected readonly view = signal<ViewMode>('grid');
  protected readonly letters = LETTERS;

  protected readonly filtered = computed<LocalArtist[]>(() => {
    const q = this.search().trim().toLowerCase();
    const letter = this.letter();
    let list = this.library.artists();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    if (letter !== 'all') {
      list = list.filter((a) =>
        letter === '#'
          ? !/^[a-zñáéíóúü]/i.test(a.name.trim())
          : a.name.trim().toLowerCase().startsWith(letter.toLowerCase()),
      );
    }
    const sorted = [...list];
    switch (this.sort()) {
      case 'tracks':
        sorted.sort((a, b) => b.trackCount - a.trackCount);
        break;
      case 'recent':
        sorted.sort((a, b) => b.lastScanIso.localeCompare(a.lastScanIso));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  });

  protected artistPhoto(artist: LocalArtist): SafeUrl | string {
    if (artist.artistImageUrl) {
      return this.sanitizer.bypassSecurityTrustUrl(artist.artistImageUrl);
    }
    const track = artist.coverTrack;
    if (!track?.coverCacheKey) return '/images/avatar-default.svg';
    const url = coverUrlFor(track, '');
    return url.startsWith('sound-cover:')
      ? this.sanitizer.bypassSecurityTrustUrl(url)
      : url || '/images/avatar-default.svg';
  }

  protected isPlaying(artist: LocalArtist): boolean {
    const current = this.player.currentTrack();
    return !!current && current.artist.trim().toLowerCase() === artist.name.trim().toLowerCase();
  }

  protected playArtist(artist: LocalArtist, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const first = artist.coverTrack;
    if (first) this.player.play(first);
  }

  protected onPhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/avatar-default.svg')) {
      img.src = '/images/avatar-default.svg';
    }
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }

  protected setLetter(letter: string): void {
    this.letter.set(letter);
  }

  protected setSort(mode: SortMode): void {
    this.sort.set(mode);
  }

  protected setView(view: ViewMode): void {
    this.view.set(view);
  }
}
