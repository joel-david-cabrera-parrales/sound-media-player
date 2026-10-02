import { PROFILE_STORAGE_KEY } from '../utils/profile-photo';

export type ThemeMode = 'light' | 'dark';

export interface UserSettings {
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const profile = JSON.parse(raw) as { settings?: Partial<UserSettings> };
    return { ...DEFAULT_SETTINGS, ...profile.settings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const profile = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const merged = {
      ...profile,
      settings: { ...DEFAULT_SETTINGS, ...settings },
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Almacenamiento no disponible: el tema solo vive en memoria
  }
}
