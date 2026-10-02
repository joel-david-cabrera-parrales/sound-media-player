import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DEFAULT_AVATAR, getStoredPhotoUrl } from '../../utils/profile-photo';
import { ShellUiService } from '../../services/shell-ui.service';

type FilterPill = 'todo' | 'carpetas';

@Component({
  selector: 'app-topbar',
  imports: [FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly shellUi = inject(ShellUiService);

  protected search = '';
  protected activePill: FilterPill = 'todo';

  protected avatarUrl: SafeUrl = DEFAULT_AVATAR;

  private readonly onStorage = (): void => this.loadAvatar();

  ngOnInit(): void {
    this.loadAvatar();
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorage);
  }

  private loadAvatar(): void {
    const stored = getStoredPhotoUrl();
    this.avatarUrl = stored ? this.sanitizer.bypassSecurityTrustUrl(stored) : DEFAULT_AVATAR;
  }

  protected onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(DEFAULT_AVATAR)) {
      console.warn('[Topbar] No se pudo cargar la foto de perfil, usando avatar por defecto:', img.src);
      img.src = DEFAULT_AVATAR;
    }
  }

  protected setPill(pill: FilterPill): void {
    this.activePill = pill;
  }

  protected toggleSidebar(): void {
    this.shellUi.toggleSidebar();
  }
}
