import { Injectable, computed, signal } from '@angular/core';
import {
  newEntry,
  newPlaylistId,
  type Playlist,
  type PlaylistDraft,
  type PlaylistEntry,
} from '../models/playlist';
import type { Track } from '../../media-player/models/track.model';

export const PLAYLISTS_KEY = 'sound.playlists';
export const PLAYLIST_DRAFT_KEY = 'sound.playlistDraft';
export const PLAYLIST_LIKES_KEY = 'sound.playlistLikes';

const EMPTY_DRAFT: PlaylistDraft = {
  playlistId: null,
  name: '',
  description: '',
  coverUrl: null,
  entries: [],
};

/** Migra string[] viejos o entries parciales al shape actual. */
function normalizeEntries(raw: unknown, fallbackDate: string): PlaylistEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: PlaylistEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      out.push({ trackId: item, addedAt: fallbackDate });
    } else if (item && typeof item === 'object') {
      const e = item as Partial<PlaylistEntry>;
      if (typeof e.trackId === 'string') {
        out.push({
          trackId: e.trackId,
          addedAt: typeof e.addedAt === 'string' ? e.addedAt : fallbackDate,
        });
      }
    }
  }
  // Sin duplicados (primera aparición manda)
  return [...new Map(out.map((e) => [e.trackId, e])).values()];
}

function readPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Playlist>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
      .map((p) => {
        const updatedAt = typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString();
        return {
          id: p.id as string,
          name: p.name as string,
          description: typeof p.description === 'string' ? p.description : '',
          coverUrl: typeof p.coverUrl === 'string' ? p.coverUrl : null,
          entries: normalizeEntries(
            (p as unknown as Record<string, unknown>)['entries'] ??
              (p as unknown as Record<string, unknown>)['trackIds'],
            updatedAt,
          ),
          createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
          updatedAt,
        };
      });
  } catch {
    return [];
  }
}

function readDraft(): PlaylistDraft {
  try {
    const raw = localStorage.getItem(PLAYLIST_DRAFT_KEY);
    if (!raw) return { ...EMPTY_DRAFT, entries: [] };
    const parsed = JSON.parse(raw) as Partial<PlaylistDraft> & { trackIds?: unknown };
    return {
      playlistId: typeof parsed.playlistId === 'string' ? parsed.playlistId : null,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      coverUrl: typeof parsed.coverUrl === 'string' ? parsed.coverUrl : null,
      entries: normalizeEntries(parsed.entries ?? parsed.trackIds, new Date().toISOString()),
    };
  } catch {
    return { ...EMPTY_DRAFT, entries: [] };
  }
}

@Injectable({ providedIn: 'root' })
export class PlaylistsService {
  readonly playlists = signal<Playlist[]>(readPlaylists());
  readonly draft = signal<PlaylistDraft>(readDraft());
  readonly count = computed(() => this.playlists().length);

  getById(id: string): Playlist | null {
    return this.playlists().find((p) => p.id === id) ?? null;
  }

  create(
    input: { name: string; description: string; coverUrl: string | null; trackIds?: string[] },
  ): Playlist {
    const now = new Date().toISOString();
    const ids =
      input.trackIds ?? this.draft().entries.map((e) => e.trackId);
    const playlist: Playlist = {
      id: newPlaylistId(),
      name: input.name.trim(),
      description: input.description.trim(),
      coverUrl: input.coverUrl,
      entries: [...new Set(ids)].map((trackId) => newEntry(trackId)),
      createdAt: now,
      updatedAt: now,
    };
    this.playlists.update((list) => [playlist, ...list]);
    this.persist();
    this.clearDraft();
    return playlist;
  }

  update(id: string, input: { name: string; description: string; coverUrl: string | null }): void {
    this.playlists.update((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, name: input.name.trim(), description: input.description.trim(), coverUrl: input.coverUrl, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    this.persist();
  }

  remove(id: string): void {
    this.playlists.update((list) => list.filter((p) => p.id !== id));
    this.persist();
    if (this.draft().playlistId === id) this.clearDraft();
  }

  addTrack(id: string, trackId: string): void {
    this.playlists.update((list) =>
      list.map((p) =>
        p.id === id
          ? p.entries.some((e) => e.trackId === trackId)
            ? p
            : { ...p, entries: [...p.entries, newEntry(trackId)], updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    this.persist();
  }

  removeTrack(id: string, trackId: string): void {
    this.playlists.update((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, entries: p.entries.filter((e) => e.trackId !== trackId), updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    this.persist();
  }

  isInPlaylist(id: string, trackId: string): boolean {
    if (id === 'draft') return this.draft().entries.some((e) => e.trackId === trackId);
    return this.getById(id)?.entries.some((e) => e.trackId === trackId) ?? false;
  }

  toggleDraftTrack(trackId: string): void {
    this.draft.update((d) => ({
      ...d,
      entries: d.entries.some((e) => e.trackId === trackId)
        ? d.entries.filter((e) => e.trackId !== trackId)
        : [...d.entries, newEntry(trackId)],
    }));
    this.persistDraft();
  }

  startDraftFor(playlistId: string | null): void {
    if (this.draft().playlistId === playlistId) return;
    const existing = playlistId ? this.getById(playlistId) : null;
    this.draft.set({
      playlistId,
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      coverUrl: existing?.coverUrl ?? null,
      entries: existing ? [...existing.entries] : [],
    });
    this.persistDraft();
  }

  clearDraft(): void {
    this.draft.set({ ...EMPTY_DRAFT });
    this.persistDraft();
  }

  /** Guarda el builder: metadatos + canciones del draft en la playlist y limpia el draft. */
  saveBuilder(id: string, meta: { name: string; description: string; coverUrl: string | null }): void {
    const entries = [...this.draft().entries];
    this.playlists.update((list) =>
      list.map((p) =>
        p.id === id
          ? {
              ...p,
              name: meta.name.trim(),
              description: meta.description.trim(),
              coverUrl: meta.coverUrl,
              entries,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    this.persist();
    this.clearDraft();
  }

  /** Resuelve entries contra tracks reales (ignora huérfanos), con fecha de adición. */
  resolveEntries(
    playlist: Pick<Playlist, 'entries'>,
    allTracks: Track[],
  ): { track: Track; addedAt: string }[] {
    const byId = new Map(allTracks.map((t) => [t.id, t]));
    const out: { track: Track; addedAt: string }[] = [];
    for (const e of playlist.entries) {
      const track = byId.get(e.trackId);
      if (track) out.push({ track, addedAt: e.addedAt });
    }
    return out;
  }

  /** Compat: ids resueltos sin fecha. */
  resolveTracks(playlist: Pick<Playlist, 'entries'>, allTracks: Track[]): Track[] {
    return this.resolveEntries(playlist, allTracks).map((r) => r.track);
  }

  readonly likedIds = signal<string[]>(this.loadLikes());

  isPlaylistLiked(id: string): boolean {
    return this.likedIds().includes(id);
  }

  togglePlaylistLike(id: string): void {
    this.likedIds.update((list) =>
      list.includes(id) ? list.filter((u) => u !== id) : [...list, id],
    );
    try {
      localStorage.setItem(PLAYLIST_LIKES_KEY, JSON.stringify(this.likedIds()));
    } catch {
      // Sin almacenamiento: solo memoria
    }
  }

  private loadLikes(): string[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(PLAYLIST_LIKES_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(this.playlists()));
    } catch {
      // Sin almacenamiento: solo memoria
    }
  }

  private persistDraft(): void {
    try {
      localStorage.setItem(PLAYLIST_DRAFT_KEY, JSON.stringify(this.draft()));
    } catch {
      // Sin almacenamiento: solo memoria
    }
  }
}
