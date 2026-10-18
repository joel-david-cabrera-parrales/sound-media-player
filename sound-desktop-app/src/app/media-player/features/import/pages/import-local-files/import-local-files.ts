import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { RelativeTimePipe } from '../../../../../shared/pipes/relative-time.pipe';
import { FavoriteButton } from '../../../../../shared/components/favorite-button/favorite-button';
import { LocalMusicService } from '../../../../services/local-music.service';
import { AudioPlayerService } from '../../../../services/audio-player.service';
import { coverUrlFor, formatTrackDuration, formatTrackSize, type Track } from '../../../../models/track.model';

@Component({
  selector: 'media-player-import-local-files',
  imports: [RouterLink, TranslatePipe, RelativeTimePipe, FavoriteButton],
  templateUrl: './import-local-files.html',
  styleUrl: './import-local-files.css',
})
export class ImportLocalFiles {
  protected readonly library = inject(LocalMusicService);
  protected readonly player = inject(AudioPlayerService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly trackCover = '/images/track-cover.svg';

  protected readonly isDragging = signal(false);
  protected readonly showDropHint = signal(false);

  protected readonly formatDuration = formatTrackDuration;
  protected readonly formatSize = formatTrackSize;

  /** Últimos tracks indexados de la librería real (preview limitado). */
  protected readonly visibleTracks = computed<Track[]>(() => this.library.recentTracks().slice(0, 8));

  private dragDepth = 0;

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

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(this.trackCover)) img.src = this.trackCover;
  }

  protected playTrack(track: Track): void {
    this.player.playContext(track, this.visibleTracks());
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

  protected async addFolder(): Promise<void> {    this.showDropHint.set(false);
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

  /** Preferencias de escaneo: función mínima real (lleva a ajustes). */
  protected openScanPrefs(): void {
    void this.router.navigate(['/library/settings']);
  }

  protected async onDirectoryPicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length > 0) {
      const first = files[0] as File & { webkitRelativePath?: string };
      const rel = first.webkitRelativePath || first.name;
      const topFolder = rel.split('/')[0] || 'web-import';
      // Sin ids huérfanos: si addFolder retorna null no se indexa.
      const id = this.library.addFolder(topFolder);
      if (!id) {
        input.value = '';
        return;
      }
      await this.library.indexWebFiles(id, files);
    }
    input.value = '';
  }

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth += 1;
    this.isDragging.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.isDragging.set(false);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragDepth = 0;
    this.isDragging.set(false);
    const paths = (event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [])
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => !!p);
    // Drop solo carpetas: ignora archivos sueltos (con extensión de audio) o avisa.
    const folders = paths.filter((p) => !/\.(mp3|flac|m4a|mp4|ogg|oga|opus|wav|aiff?|wma|aac|dsf|dff)$/i.test(p));
    if (folders.length > 0) {
      for (const p of folders) {
        const id = this.library.addFolder(p);
        if (id) await this.library.rescan(id);
      }
      if (folders.length < paths.length) this.showDropHint.set(true);
    } else {
      this.showDropHint.set(true);
    }
  }
}
