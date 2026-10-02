import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'welcome-app',
  imports: [TranslatePipe],
  templateUrl: './welcome-app.html',
  styleUrl: './welcome-app.css',
})
export class WelcomeApp {
  private readonly router = inject(Router);

  constructor() {
    setTimeout(() => {
      this.navigateToInitialSetup();
    }, 3500);
  }

  protected navigateToInitialSetup(): void {
    this.router.navigate(['/welcome/initial-setup']);
  }
}
