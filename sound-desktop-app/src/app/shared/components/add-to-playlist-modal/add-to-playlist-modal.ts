import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TrackMenuService } from '../../services/track-menu.service';
import { TranslationService } from '../../services/translation.service';
import { PlaylistsService } from '../../../playlist/services/playlists.service';
import { PlaylistFormModal, type PlaylistFormValue } from '../playlist-form-modal/playlist-form-modal';
import { normalizeText } from '../../utils/text';

@Component({
  selector: 'shared-add-to-playlist-modal',
  imports: [TranslatePipe, PlaylistFormModal],
  templateUrl: './add-to-playlist-modal.html',
  styleUrl: './add-to-playlist-modal.css',
})
export class AddToPlayListModal {
  protected readonly menu = inject(TrackMenuService);
  protected readonly store = inject(PlaylistsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly i18n = inject(TranslationService);

  protected readonly search = signal('');
  protected readonly showCreate = signal(false);

  constructor() {
    // Resetea el estado interno al cerrar el modal.
    effect(() => {
      if (!this.menu.assignOpen()) {
        this.showCreate.set(false);
        this.search.set('');
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.showCreate()) {
      this.showCreate.set(false);
      return;
    }
    if (this.menu.assignOpen()) this.menu.closeAssign();
  }

  protected readonly filtered = computed(() => {
    const q = normalizeText(this.search());
    const list = this.store.playlists();
    if (!q) return list;
    return list.filter(
      (p) => normalizeText(p.name).includes(q) || normalizeText(p.description).includes(q),
    );
  });

  protected playlistTrackCount(playlistId: string): number {
    const playlist = this.store.getById(playlistId);
    if (!playlist) return 0;
    // Método ligero: el conteo visible usa el servicio de librería si está disponible
    return playlist.entries.length;
  }

  protected playlistCover(playlistId: string): string | SafeUrl {    const playlist = this.store.getById(playlistId);
    if (!playlist) return '/images/track-cover.svg';
    if (playlist.coverUrl) {
      const url = playlist.coverUrl;
      if (url.startsWith('sound-photo:') || url.startsWith('data:') || url.startsWith('sound-cover:')) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
      }
      return url;
    }
    return '/images/track-cover.svg';
  }

  protected onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/track-cover.svg')) img.src = '/images/track-cover.svg';
  }

  protected toggleIn(playlistId: string): void {
    const target = this.menu.selectedTrack();
    if (!target) return;
    if (this.store.isInPlaylist(playlistId, target.id)) {
      this.store.removeTrack(playlistId, target.id);
    } else {
      this.store.addTrack(playlistId, target.id);
      this.menu.showToast(
        this.i18n.translate('trackMenu.toastAdded', {
          track: target.title,
          list: this.store.getById(playlistId)?.name ?? '',
        }),
      );
    }
  }

  protected isIn(playlistId: string): boolean {
    const target = this.menu.selectedTrack();
    return target ? this.store.isInPlaylist(playlistId, target.id) : false;
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }

  protected async onCreated(value: PlaylistFormValue): Promise<void> {
    const target = this.menu.selectedTrack();
    const created = this.store.create({ ...value, trackIds: target ? [target.id] : [] });
    if (target) {
      this.menu.showToast(
        this.i18n.translate('trackMenu.toastAdded', { track: target.title, list: created.name }),
      );
    }
    this.showCreate.set(false);
  }
}
