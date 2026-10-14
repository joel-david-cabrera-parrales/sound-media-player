import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.add('dark');
  });

  it('should create with dark theme by default', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    expect(service).toBeTruthy();
    expect(service.theme()).toBe('dark');
  });

  it('should toggle theme and persist it in the profile', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    service.toggleTheme();
    expect(service.theme()).toBe('light');
    const stored = JSON.parse(localStorage.getItem('sound.profile') ?? '{}') as {
      settings?: { theme?: string };
    };
    expect(stored.settings?.theme).toBe('light');
  });

  it('should set accent, persist it and write CSS vars without losing theme', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    service.setTheme('light');
    service.setAccent('violet');
    expect(service.accent()).toBe('violet');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#8b5cf6');
    const stored = JSON.parse(localStorage.getItem('sound.profile') ?? '{}') as {
      settings?: { theme?: string; accent?: string };
    };
    expect(stored.settings).toEqual({ theme: 'light', accent: 'violet' });
  });

  it('should accept system theme', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    service.setTheme('system');
    expect(service.theme()).toBe('system');
    expect(typeof service.isDark()).toBe('boolean');
  });
});
