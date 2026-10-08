import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PlaylistFormModal, type PlaylistFormValue } from '../../../shared/components/playlist-form-modal/playlist-form-modal';
import { PlaylistsService } from '../../services/playlists.service';
import type { Playlist } from '../../models/playlist';
import { LocalMusicService } from '../../../media-player/services/local-music.service';
import { coverUrlFor, type Track } from '../../../media-player/models/track.model';

@Component({
  selector: 'playlist-list',
  imports: [RouterLink, TranslatePipe, PlaylistFormModal],
  templateUrl: './playlists-list.html',
  styleUrl: './playlists-list.css',
})
export class PlaylistsList {
  protected readonly store = inject(PlaylistsService);
  protected readonly library = inject(LocalMusicService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly search = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly confirmDeleteId = signal<string | null>(null);

  protected readonly filtered = computed<Playlist[]>(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.store.playlists();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  });

  protected memberTracks(playlist: Playlist): Track[] {
    return this.store.resolveTracks(playlist, this.library.tracks());
  }

  protected mosaic(playlist: Playlist): (string | SafeUrl)[] {
    if (playlist.coverUrl) return [this.safeUrl(playlist.coverUrl)];
    return this.memberTracks(playlist)
      .filter((t) => !!t.coverCacheKey)
      .slice(0, 4)
      .map((t) => this.safeUrl(coverUrlFor(t, '')));
  }

  private safeUrl(url: string): string | SafeUrl {
    if (!url) return '/images/track-cover.svg';
    if (url.startsWith('sound-photo:') || url.startsWith('sound-cover:') || url.startsWith('data:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) img.src = '/images/track-cover.svg';
  }

  protected openCreate(): void {
    this.modalOpen.set(true);
  }

  protected onModalClosed(): void {
    this.modalOpen.set(false);
  }

  protected async onModalSaved(value: PlaylistFormValue): Promise<void> {
    const created = this.store.create(value);
    this.modalOpen.set(false);
    await this.router.navigate(['/playlist', created.id, 'edit']);
  }

  protected askDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.confirmDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  protected confirmDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.store.remove(id);
    this.confirmDeleteId.set(null);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }
}
