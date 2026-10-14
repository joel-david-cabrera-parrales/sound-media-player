import { PROFILE_STORAGE_KEY } from '../utils/profile-photo';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentId = 'cyan' | 'violet' | 'emerald' | 'fuchsia' | 'amber';

export interface AccentDef {
  id: AccentId;
  base: string;
  deep: string;
}

export const ACCENTS: AccentDef[] = [
  { id: 'cyan', base: '#00d2ff', deep: '#0088cc' },
  { id: 'violet', base: '#8b5cf6', deep: '#6d28d9' },
  { id: 'emerald', base: '#10b981', deep: '#047857' },
  { id: 'fuchsia', base: '#ec4899', deep: '#be185d' },
  { id: 'amber', base: '#f59e0b', deep: '#b45309' },
];

export interface UserSettings {
  theme: ThemeMode;
  accent: AccentId;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accent: 'cyan',
};

function normalize(raw: Partial<UserSettings> | undefined): UserSettings {
  const theme = raw?.theme === 'light' || raw?.theme === 'dark' || raw?.theme === 'system'
    ? raw.theme
    : DEFAULT_SETTINGS.theme;
  const accent = ACCENTS.some((a) => a.id === raw?.accent) && raw?.accent
    ? (raw.accent as AccentId)
    : DEFAULT_SETTINGS.accent;
  return { theme, accent };
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const profile = JSON.parse(raw) as { settings?: Partial<UserSettings> };
    return normalize(profile.settings);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<UserSettings>): UserSettings {
  const merged = normalize({ ...loadSettings(), ...patch });
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const profile = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...profile, settings: merged }),
    );
  } catch {
    // Almacenamiento no disponible: los settings solo viven en memoria
  }
  return merged;
}
