import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'welcome-general-setup',
  imports: [],
  templateUrl: './general-setup.html',
  styleUrl: './general-setup.css',
})
export class GeneralSetup {
  private readonly router = inject(Router);

  constructor() {
    setTimeout(() => {
      this.navigateToLibrary();
    }, 3500);
  }

  protected navigateToLibrary(): void {
    this.router.navigate(['/library']);
  }
}
