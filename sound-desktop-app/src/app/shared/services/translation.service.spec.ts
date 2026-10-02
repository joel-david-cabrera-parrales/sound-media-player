import { TranslationService } from './translation.service';

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
