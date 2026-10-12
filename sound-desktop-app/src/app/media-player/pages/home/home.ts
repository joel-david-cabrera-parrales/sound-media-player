import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PROFILE_STORAGE_KEY } from '../../../shared/utils/profile-photo';
import { LocalMusicService, type LocalArtist } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, type Track } from '../../models/track.model';
import { genreImage } from '../../models/genre-images';
import { DEFAULT_GENRE_COVER } from '../../models/genre-taxonomy';

function getProfileFirstName(): string {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return 'Alex';
    const profile = JSON.parse(raw) as { name?: unknown };
    if (typeof profile.name === 'string' && profile.name.trim()) {
      return profile.name.trim().split(/\s+/)[0];
    }
    return 'Alex';
  } catch {
    return 'Alex';
  }
}

interface GenreStat {
  id: string;
  name: string;
  count: number;
  cover: string;
}

@Component({
  selector: 'media-player-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly userName = getProfileFirstName();

  protected readonly greetingKey: string = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.greeting.morning';
    if (hour < 20) return 'home.greeting.afternoon';
    return 'home.greeting.night';
  })();

  /** Reanudar: track actual del player o el más reciente. */
  protected readonly resumeTrack = computed<Track | null>(
    () => this.player.currentTrack() ?? this.library.recentTracks()[0] ?? null,
  );

  /** Top 6 artistas por canciones. */
  protected readonly topArtists = computed<LocalArtist[]>(() =>
    [...this.library.artists()].sort((a, b) => b.trackCount - a.trackCount).slice(0, 6),
  );

  /** Últimos 5 indexados. */
  protected readonly newReleases = computed<Track[]>(() =>
    this.library.recentTracks().slice(0, 5),
  );

  /** Progreso real del track en curso (0-100). */
  protected readonly continueProgress = computed(() => {
    const dur = this.player.durationSec() || this.player.currentTrack()?.durationSec || 0;
    if (!dur) return 0;
    return Math.min(100, Math.max(0, (this.player.currentTimeSec() / dur) * 100));
  });

  /** Géneros canónicos con conteos y portada (linkean a la página de género). */
  protected readonly genreStats = computed<GenreStat[]>(() =>
    this.library.libraryGenres().slice(0, 5).map((g) => ({
      id: g.id,
      name: g.label,
      count: g.count,
      cover: genreImage(g.id),
    })),
  );

  protected onGenreImgError(event: Event): void {
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

  protected artistCover(artist: LocalArtist): string | SafeUrl {
    if (!artist.coverTrack) return '/images/avatar-default.svg';
    return this.coverFor(artist.coverTrack);
  }

  protected hasArtistCover(artist: LocalArtist): boolean {
    return !!artist.coverTrack?.coverCacheKey;
  }

  protected onImgError(event: Event, fallback: string): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  }

  protected formatDuration(totalSec: number | null): string {
    return formatTrackDuration(totalSec);
  }

  protected artistFirstTrack(artist: LocalArtist): Track | null {
    const key = artist.name.trim().toLowerCase();
    return (
      this.library.tracks().find((t) => t.artist.trim().toLowerCase() === key) ?? null
    );
  }

  protected playTrack(track: Track | null): void {
    if (track) this.player.play(track);
  }

  protected playArtist(artist: LocalArtist, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playTrack(this.artistFirstTrack(artist));
  }

  protected isCurrentTrack(track: Track): boolean {
    return this.player.currentTrack()?.id === track.id;
  }
}
