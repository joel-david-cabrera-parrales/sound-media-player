import { type SafeUrl } from '@angular/platform-browser';
import { coverUrlFor, type Track } from '../../media-player/models/track.model';

type SanitizerLike = { bypassSecurityTrustUrl(value: string): SafeUrl };

const MAX_ENTRIES = 500;

/** URL cruda de carátula memoizada por coverCacheKey (evita recomputar por CD). */
const urlCache = new Map<string, string>();
/** SafeUrl memoizado por URL (evita nuevo objeto por CD y recargas del <img>). */
const safeCache = new Map<string, SafeUrl>();

function prune(map: Map<string, unknown>): void {
  if (map.size > MAX_ENTRIES) map.clear();
}

/** Limpia las cachés (tests o cambios masivos de librería). */
export function clearCoverCache(): void {
  urlCache.clear();
  safeCache.clear();
}

/** Devuelve el SafeUrl cacheado para una URL custom (sound-cover:/sound-photo:/data:). */
export function safeUrlCached(sanitizer: SanitizerLike, url: string): SafeUrl {
  const hit = safeCache.get(url);
  if (hit) return hit;
  const safe = sanitizer.bypassSecurityTrustUrl(url);
  safeCache.set(url, safe);
  prune(safeCache);
  return safe;
}

/**
 * Carátula de track memoizada por coverCacheKey (o id sin cover).
 * Los call sites principales la usan en vez de llamar a bypassSecurityTrustUrl por CD.
 */
export function trackCoverCached(
  sanitizer: SanitizerLike,
  track: Track,
  fallback = '/images/track-cover.svg',
): string | SafeUrl {
  const key = track.coverCacheKey ? `c:${track.coverCacheKey}` : `n:${track.id}`;
  const cachedUrl = urlCache.get(key);
  const url = cachedUrl ?? coverUrlFor(track, fallback);
  if (cachedUrl === undefined) {
    urlCache.set(key, url);
    prune(urlCache);
  }
  if (url.startsWith('sound-cover:')) return safeUrlCached(sanitizer, url);
  return url;
}
