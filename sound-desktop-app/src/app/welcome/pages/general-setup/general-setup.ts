import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'welcome-general-setup',
  imports: [TranslatePipe],
  templateUrl: './general-setup.html',
  styleUrl: './general-setup.css',
})
export class GeneralSetup implements OnDestroy {
  private readonly router = inject(Router);
  private readonly timer: ReturnType<typeof setTimeout>;

  constructor() {
    this.timer = setTimeout(() => {
      this.navigateToLibrary();
    }, 3500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  protected navigateToLibrary(): void {
    this.router.navigate(['/media-player']);
  }
}
