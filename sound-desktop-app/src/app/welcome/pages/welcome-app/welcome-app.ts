import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'welcome-app',
  imports: [TranslatePipe],
  templateUrl: './welcome-app.html',
  styleUrl: './welcome-app.css',
})
export class WelcomeApp implements OnDestroy {
  private readonly router = inject(Router);
  private readonly timer: ReturnType<typeof setTimeout>;

  constructor() {
    this.timer = setTimeout(() => {
      this.navigateToInitialSetup();
    }, 3500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  protected navigateToInitialSetup(): void {
    this.router.navigate(['/welcome/initial-setup']);
  }
}
