import { Injectable, effect, signal } from '@angular/core';
import {
  ACCENTS,
  AccentId,
  ThemeMode,
  loadSettings,
  saveSettings,
} from '../models/user-settings';

function systemIsDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(loadSettings().theme);
  readonly accent = signal<AccentId>(loadSettings().accent);
  private readonly systemDark = signal<boolean>(systemIsDark());

  /** Tema efectivo (resuelve `system` contra el SO). */
  readonly isDark = (): boolean => {
    const t = this.theme();
    return t === 'dark' || (t === 'system' && this.systemDark());
  };

  constructor() {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this.systemDark.set(e.matches));
    } catch {
      // matchMedia no disponible: se queda el valor inicial
    }
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
    effect(() => {
      const def = ACCENTS.find((a) => a.id === this.accent()) ?? ACCENTS[0];
      const root = document.documentElement;
      root.style.setProperty('--accent', def.base);
      root.style.setProperty('--accent-deep', def.deep);
    });
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    saveSettings({ theme });
  }

  toggleTheme(): void {
    const current = this.theme();
    this.setTheme(current === 'dark' ? 'light' : current === 'light' ? 'dark' : (this.isDark() ? 'light' : 'dark'));
  }

  setAccent(accent: AccentId): void {
    this.accent.set(accent);
    saveSettings({ accent });
  }
}
