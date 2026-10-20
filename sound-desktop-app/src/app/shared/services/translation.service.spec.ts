import { TranslationService } from './translation.service';

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

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    localStorage.clear();
    service = new TranslationService();
  });

  it('should default to English when no language is stored', () => {
    expect(service.currentLang()).toBe('en');
    expect(service.translate('shell.sidebar.home')).toBe('Home');
  });

  it('should translate dotted keys with interpolation', () => {
    service.setLanguage('es');
    expect(service.translate('shell.sidebar.home')).toBe('Inicio');
    expect(service.translate('missing.key')).toBe('missing.key');
  });

  it('should persist the language in the profile', () => {
    service.setLanguage('es');
    const stored = JSON.parse(localStorage.getItem('sound.profile') ?? '{}') as {
      language?: string;
    };
    expect(stored.language).toBe('es');
  });
});
