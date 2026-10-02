export const PROFILE_STORAGE_KEY = 'sound.profile';

export const DEFAULT_AVATAR = '/images/avatar-default.svg';

export function getStoredPhotoUrl(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { photo?: unknown };
    return typeof data.photo === 'string' && data.photo ? data.photo : null;
  } catch {
    return null;
  }
}
