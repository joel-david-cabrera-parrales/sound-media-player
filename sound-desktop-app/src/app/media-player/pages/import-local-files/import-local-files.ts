import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocalMusicService } from '../../services/local-music.service';

interface RecentTrack {
  img: string;
  hue: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  hiRes: boolean;
  size: string;
  duration: string;
}

@Component({
  selector: 'media-player-import-local-files',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './import-local-files.html',
  styleUrl: './import-local-files.css',
})
export class ImportLocalFiles {
  protected readonly library = inject(LocalMusicService);
  protected readonly trackCover = '/images/track-cover.svg';

  protected readonly isDragging = signal(false);
  protected readonly showDropHint = signal(false);

  @ViewChild('dirInput') private dirInput?: ElementRef<HTMLInputElement>;

  protected readonly recentTracks: RecentTrack[] = [
    {
      img: '/images/track-cover.svg',
      hue: '',
      title: 'Resonance',
      artist: 'HOME',
      album: 'Odyssey',
      format: 'FLAC 24-bit / 96kHz',
      hiRes: true,
      size: '42.8 MB',
      duration: '3:32',
    },
    {
      img: '/images/track-cover.svg',
      hue: 'hue-rotate-[140deg]',
      title: 'Nightcall',
      artist: 'Kavinsky',
      album: 'OutRun (Original Master)',
      format: 'FLAC 24-bit / 48kHz',
      hiRes: true,
      size: '51.2 MB',
      duration: '4:19',
    },
    {
      img: '/images/track-cover.svg',
      hue: 'hue-rotate-[250deg]',
      title: 'Days of Thunder',
      artist: 'The Midnight',
      album: 'Days of Thunder EP',
      format: 'ALAC 16-bit / 44.1kHz',
      hiRes: false,
      size: '38.0 MB',
      duration: '5:24',
    },
    {
      img: '/images/track-cover.svg',
      hue: 'hue-rotate-[90deg]',
      title: 'Outro',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      format: 'FLAC 24-bit / 96kHz',
      hiRes: true,
      size: '49.4 MB',
      duration: '4:07',
    },
  ];

  protected async addFolder(): Promise<void> {
    this.showDropHint.set(false);
    const api = window.electronAPI;
    if (api?.openDirectoryDialogue) {
      const result = await api.openDirectoryDialogue();
      if (!result.canceled && result.dirPath) {
        this.library.addFolder(result.dirPath);
      }
      return;
    }
    this.dirInput?.nativeElement.click();
  }

  protected onDirectoryPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      const first = files[0] as File & { webkitRelativePath?: string };
      const rel = first.webkitRelativePath || first.name;
      const topFolder = rel.split('/')[0];
      if (topFolder) this.library.addFolder(topFolder);
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

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const paths = (event.dataTransfer?.files
      ? Array.from(event.dataTransfer.files)
      : []
    )
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      for (const p of paths) this.library.addFolder(p);
    } else {
      this.showDropHint.set(true);
    }
  }
}
