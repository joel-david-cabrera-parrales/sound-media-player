export const PROFILE_STORAGE_KEY = 'sound.profile';

export const DEFAULT_AVATAR = '/images/avatar-default.svg';

/**
 * Migra URLs legacy de foto (`sound-photo:///C:/...` o la forma normalizada
 * por Chromium `sound-photo://c/...`) al formato query
 * `sound-photo://photo?path=<enc>`. Devuelve null si no hay foto.
 */
export function migrateLegacyPhotoUrl(url: string | null | undefined): string | null {
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith('sound-photo://photo?path=')) return url;
  const m = url.match(/^sound-photo:\/\/([^?#]*)([?#].*)?$/);
  if (!m) return url.startsWith('sound-photo:') ? null : url;
  let tail = m[1] ?? '';
  // Quitar slashes de borde del formato legacy triple-slash
  tail = tail.replace(/^\/+/, '');
  let decoded: string;
  try {
    decoded = decodeURIComponent(tail);
  } catch {
    decoded = tail;
  }
  decoded = decoded.replace(/^\/+/, '');
  // Reparar `c/Users/...` (unidad sin dos puntos por normalización de Chromium)
  if (/^[A-Za-z]\//.test(decoded) && !/^[A-Za-z]:\//.test(decoded)) {
    decoded = `${decoded[0].toUpperCase()}:/${decoded.slice(2)}`;
  }
  if (!decoded) return null;
  if (/^[A-Za-z]:\//.test(decoded) || decoded.startsWith('//')) {
    const normalized = decoded.replace(/\\/g, '/');
    return `sound-photo://photo?path=${encodeURIComponent(normalized)}`;
  }
  // data:/blob:/http: se dejan tal cual
  if (/^(data|blob|https?):/i.test(url)) return url;
  return null;
}

export function getStoredPhotoUrl(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { photo?: unknown };
    const photo = typeof data.photo === 'string' && data.photo ? data.photo : null;
    const migrated = migrateLegacyPhotoUrl(photo);
    if (migrated && migrated !== photo) {
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...data, photo: migrated }));
      } catch {
        // cuota: se usa en memoria
      }
    }
    return migrated;
  } catch {
    return null;
  }
}
