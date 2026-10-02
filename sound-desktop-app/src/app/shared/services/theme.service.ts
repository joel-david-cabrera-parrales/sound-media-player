import { Injectable, effect, signal } from '@angular/core';
import {
  ThemeMode,
  loadSettings,
  saveSettings,
} from '../models/user-settings';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(loadSettings().theme);

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.theme() === 'dark');
    });
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    saveSettings({ theme });
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }
}
