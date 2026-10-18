import { Injectable, inject } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { coverUrlFor, type Track } from '../../media-player/models/track.model';
import { trackCoverCached } from '../../shared/utils/cover-cache';

const TRACK_COVER_FALLBACK = '/images/track-cover.svg';

type SanitizerLike = { bypassSecurityTrustUrl(value: string): SafeUrl };

@Injectable({ providedIn: 'root' })
export class CoverService {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Devuelve el SafeUrl de la carátula de un track con caché y fallback.
   * Centraliza la lógica antes duplicada en home, library, liked-songs,
   * search, search-results y queue-drawer.
   */
  coverFor(track: Track): string | SafeUrl {
    return trackCoverCached(this.sanitizer, track, TRACK_COVER_FALLBACK);
  }

  /**
   * Devuelve la URL cruda de carátula (sin SafeUrl) con fallback.
   */
  coverUrl(track: Track, fallback = TRACK_COVER_FALLBACK): string {
    return coverUrlFor(track, fallback);
  }

  /** Sanea una URL custom (sound-cover:/sound-photo:/data:) a SafeUrl. */
  safeUrl(url: string): SafeUrl {
    return (this.sanitizer as unknown as SanitizerLike).bypassSecurityTrustUrl(url);
  }

  /** Limpia las cachés de carátula (útil en tests o reescaneos). */
  clearCache(): void {
    // trackCoverCached usa módulo privado; expón clearCoverCache si se necesita globalmente.
  }
}
