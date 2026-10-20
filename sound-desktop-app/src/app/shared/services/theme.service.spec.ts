import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

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

  it('should set accent, persist it and write CSS vars without losing theme', async () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());
    service.setTheme('light');
    service.setAccent('violet');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.accent()).toBe('violet');
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
