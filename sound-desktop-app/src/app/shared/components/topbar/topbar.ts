import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DEFAULT_AVATAR, PROFILE_STORAGE_KEY, getStoredPhotoUrl } from '../../utils/profile-photo';
import { ShellUiService } from '../../services/shell-ui.service';
import { ThemeService } from '../../services/theme.service';

type FilterPill = 'todo' | 'carpetas';

@Component({
  selector: 'shared-topbar',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly shellUi = inject(ShellUiService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  protected search = '';
  protected activePill: FilterPill = 'todo';

  protected avatarUrl: SafeUrl = DEFAULT_AVATAR;
  protected readonly accountMenuOpen = signal(false);

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

  protected submitSearch(): void {
    const q = this.search.trim();
    if (!q) return;
    void this.router.navigate(['/library/search/results'], { queryParams: { q } });
  }

  protected toggleSidebar(): void {
    this.shellUi.toggleSidebar();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected isDarkTheme(): boolean {
    return this.themeService.isDark();
  }

  protected userName(): string {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = raw ? (JSON.parse(raw) as { name?: unknown }) : {};
      if (typeof profile.name === 'string' && profile.name.trim()) return profile.name.trim();
    } catch {
      // Sin perfil: fallback
    }
    return 'Sound';
  }

  protected toggleAccountMenu(): void {
    this.accountMenuOpen.update((v) => !v);
  }

  protected closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeAccountMenu();
  }

  protected quitApp(): void {
    this.closeAccountMenu();
    const api = window.electronAPI as unknown as { quitApp?: () => void } | undefined;
    if (api?.quitApp) {
      api.quitApp();
    } else {
      window.close();
    }
  }
}
