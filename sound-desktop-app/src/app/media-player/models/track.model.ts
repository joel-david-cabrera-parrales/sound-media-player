export interface Track {
  id: string;
  folderId: string;
  /** Ruta absoluta en disco (índice del sistema). Solo reproducible vía sound-audio:// en Electron. */
  filePath: string;
  title: string;
  artist: string;
  album: string;
  genre?: string | null;
  year?: number | null;
  trackNo?: number | null;
  durationSec: number | null;
  /** Etiqueta legible: ej. "FLAC 24-bit / 96kHz" */
  format: string;
  codec?: string | null;
  bitrateKbps?: number | null;
  sampleRateHz?: number | null;
  bitsPerSample?: number | null;
  sizeBytes: number;
  /** Clave de carátula cacheada en userData/covers (se sirve vía sound-cover://). */
  coverCacheKey?: string | null;
  hiRes: boolean;
  /** Solo fallback web (webkitdirectory): URL temporal para previsualizar sin Electron. */
  objectUrl?: string | null;
}

export function formatTrackDuration(totalSec: number | null | undefined): string {
  if (totalSec == null || !Number.isFinite(totalSec) || totalSec < 0) return '--:--';
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTrackSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

export function audioUrlFor(track: Track): string | null {
  const api = window.electronAPI;
  if (api?.toAudioUrl && track.filePath && !track.objectUrl) {
    try {
      return api.toAudioUrl(track.filePath);
    } catch {
      return null;
    }
  }
  // Fallback web: blob temporal creado desde <input webkitdirectory>
  return track.objectUrl ?? null;
}

export function coverUrlFor(track: Track, fallback = '/images/track-cover.svg'): string {
  const api = window.electronAPI;
  if (api?.toCoverUrl && track.coverCacheKey) {
    try {
      return api.toCoverUrl(track.coverCacheKey);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
