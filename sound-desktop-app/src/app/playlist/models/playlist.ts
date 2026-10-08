export interface PlaylistEntry {
  trackId: string;
  addedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  entries: PlaylistEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDraft {
  playlistId: string | null;
  name: string;
  description: string;
  coverUrl: string | null;
  entries: PlaylistEntry[];
}

export function newPlaylistId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `playlist-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export function newEntry(trackId: string): PlaylistEntry {
  return { trackId, addedAt: new Date().toISOString() };
}
