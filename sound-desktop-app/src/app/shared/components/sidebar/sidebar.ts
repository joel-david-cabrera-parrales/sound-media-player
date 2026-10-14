import { Component, HostListener, OnDestroy, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ShellUiService } from '../../services/shell-ui.service';

@Component({
  selector: 'shared-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnDestroy {
  private readonly shellUi = inject(ShellUiService);

  protected readonly drawerOpen = this.shellUi.sidebarOpen;

  constructor() {
    // Scroll-lock móvil: bloquea el scroll del body mientras el drawer está abierto.
    effect(() => {
      if (this.drawerOpen()) {
        try {
          document.body.style.overflow = 'hidden';
        } catch {
          // Sin DOM: se ignora
        }
      } else {
        try {
          document.body.style.overflow = '';
        } catch {
          // Sin DOM: se ignora
        }
      }
    });
  }

  ngOnDestroy(): void {
    try {
      document.body.style.overflow = '';
    } catch {
      // Sin DOM: se ignora
    }
  }

  protected closeDrawer(): void {
    this.shellUi.closeSidebar();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.drawerOpen()) this.closeDrawer();
  }
}
