import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { FavoriteButton } from '../../../shared/components/favorite-button/favorite-button';
import { LocalMusicService } from '../../services/local-music.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, formatTrackSize, type Track } from '../../models/track.model';

@Component({
  selector: 'media-player-import-local-files',
  imports: [RouterLink, TranslatePipe, RelativeTimePipe, FavoriteButton],
  templateUrl: './import-local-files.html',
  styleUrl: './import-local-files.css',
})
export class ImportLocalFiles {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly trackCover = '/images/track-cover.svg';

  protected readonly isDragging = signal(false);
  protected readonly showDropHint = signal(false);

  protected readonly formatDuration = formatTrackDuration;
  protected readonly formatSize = formatTrackSize;

  /** Últimos tracks indexados de la librería real. */
  protected readonly visibleTracks = computed<Track[]>(() => this.library.recentTracks());

  @ViewChild('dirInput') private dirInput?: ElementRef<HTMLInputElement>;

  protected coverFor(track: Track): string | SafeUrl {
    const url = coverUrlFor(track, this.trackCover);
    // Los schemes custom (sound-cover:) los marca Angular como inseguros;
    // se sanean igual que la foto de perfil en initial-setup.
    if (url.startsWith('sound-cover:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected playTrack(track: Track): void {
    this.player.play(track);
  }

  protected isPlayingTrack(track: Track): boolean {
    return this.player.isCurrent(track) && this.player.isPlaying();
  }

  protected isLiked(track: Track): boolean {
    return this.library.isLiked(track.id);
  }

  protected toggleLike(track: Track): void {
    this.library.toggleLike(track.id);
  }

  protected async addFolder(): Promise<void> {
    this.showDropHint.set(false);
    const api = window.electronAPI;
    if (api?.openDirectoryDialogue) {
      const result = await api.openDirectoryDialogue();
      if (!result.canceled && result.dirPath) {
        const id = this.library.addFolder(result.dirPath);
        if (id) await this.library.rescan(id);
      }
      return;
    }
    this.dirInput?.nativeElement.click();
  }

  protected async onDirectoryPicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length > 0) {
      const first = files[0] as File & { webkitRelativePath?: string };
      const rel = first.webkitRelativePath || first.name;
      const topFolder = rel.split('/')[0] || 'web-import';
      const id = this.library.addFolder(topFolder) ?? `folder-${Date.now()}`;
      await this.library.indexWebFiles(id, files);
    }
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const paths = (event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [])
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      for (const p of paths) {
        const id = this.library.addFolder(p);
        if (id) await this.library.rescan(id);
      }
    } else {
      this.showDropHint.set(true);
    }
  }
}
