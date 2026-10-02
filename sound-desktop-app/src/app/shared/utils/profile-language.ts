import { PROFILE_STORAGE_KEY } from './profile-photo';

export type AppLanguage = 'es' | 'en';

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export function getStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_LANGUAGE;
    const profile = JSON.parse(raw) as { language?: unknown };
    return profile.language === 'es' || profile.language === 'en'
      ? profile.language
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function setStoredLanguage(language: AppLanguage): void {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const profile = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...profile, language }),
    );
  } catch {
    // Almacenamiento no disponible: el idioma solo vive en memoria
  }
}
