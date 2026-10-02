import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'welcome-initial-setup',
  imports: [],
  templateUrl: './initial-setup.html',
  styleUrl: './initial-setup.css',
})
export class InitialSetup {
  private readonly router = inject(Router);

  constructor() {
    setTimeout(() => {
      this.navigateToGeneralSetup();
    }, 3500);
  }

  protected navigateToGeneralSetup(): void {
    this.router.navigate(['/welcome/general-setup']);
  }
}
