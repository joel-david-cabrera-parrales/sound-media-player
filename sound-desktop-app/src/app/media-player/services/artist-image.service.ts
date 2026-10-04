import { Injectable, signal, effect } from '@angular/core';
import { normalizeArtistName, normalizeArtistNameForApi } from '../services/local-music.service';

const CACHE_KEY = 'sound.artistImages';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

interface CachedImage {
  url: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ArtistImageService {
  private readonly cache = signal<Record<string, CachedImage>>({});

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache()));
      } catch {
        // ignore quota errors
      }
    });
    this.loadCache();
  }

  async fetchArtistImage(artistName: string): Promise<string | null> {
    const normalized = normalizeArtistNameForApi(artistName);
    const legacyKey = normalizeArtistName(artistName);

    // Check new format first
    let cached = this.cache()[normalized];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.url;
    }
    // Fallback to legacy format (no underscores)
    cached = this.cache()[legacyKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.url;
    }

    try {
      const api = window.electronAPI;
      if (!api?.fetchDeezerArtistImage) {
        console.warn('electronAPI.fetchDeezerArtistImage no disponible');
        return null;
      }
      const url = await api.fetchDeezerArtistImage(artistName);
      if (url) {
        this.cache.update(c => ({ ...c, [normalized]: { url, timestamp: Date.now() } }));
      }
      return url;
    } catch {
      return null;
    }
  }

  private loadCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, CachedImage>;
        this.cache.set(parsed);
      }
    } catch {
      // ignore
    }
  }
}