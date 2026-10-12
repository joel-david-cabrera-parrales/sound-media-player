import { Component, HostListener, inject } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TrackMenuService } from '../../services/track-menu.service';
import { coverUrlFor, type Track } from '../../../media-player/models/track.model';

@Component({
  selector: 'shared-track-context-menu',
  imports: [TranslatePipe],
  templateUrl: './track-context-menu.html',
  styleUrl: './track-context-menu.css',
})
export class TrackContextMenu {
  protected readonly service = inject(TrackMenuService);
  private readonly sanitizer = inject(DomSanitizer);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.service.closeMenu();
  }

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
