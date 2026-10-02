import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShellUiService } from '../../services/shell-ui.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly shellUi = inject(ShellUiService);

  protected readonly drawerOpen = this.shellUi.sidebarOpen;

  protected closeDrawer(): void {
    this.shellUi.closeSidebar();
  }
}
