import { Component, input, computed, inject, effect } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { CoverService } from '../../services/cover.service';
import type { Track } from '../../../media-player/models/track.model';
import { appAssetUrl } from '../../utils/app-asset-url';

@Component({
  selector: 'shared-track-cover',
  imports: [],
  templateUrl: './track-cover.html',
  styleUrl: './track-cover.css',
})
export class TrackCover {
  readonly track = input<Track | null>(null);
  readonly fallback = input<string>(appAssetUrl('/images/track-cover.svg'));
  readonly alt = input<string>('');
  readonly klass = input<string>('');
  readonly width = input<string>('');
  readonly height = input<string>('');

  private readonly cover = inject(CoverService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly coverUrl = computed<string | SafeUrl | null>(() => {
    const t = this.track();
    if (!t) return null;
    return this.cover.coverFor(t);
  });

  protected onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = appAssetUrl(this.fallback());
    if (img.src !== fallback) {
      img.src = fallback;
    }
  }
}
