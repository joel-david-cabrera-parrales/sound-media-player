import type { Track } from '../app/media-player/models/track.model';

export interface OpenFileResult {
  canceled: boolean;
  filePath: string | null;
}

export interface OpenDirectoryResult {
  canceled: boolean;
  dirPath: string | null;
}

export interface ScanFolderInput {
  folderId: string;
  dirPath: string;
}

export interface ScanFolderResult {
  tracks: Track[];
  total: number;
  errors: number;
  scannedMs: number;
}

export interface ScanProgress {
  folderId: string;
  done: number;
  total: number;
}

export interface ElectronAPI {
  openFileDialogue: () => Promise<OpenFileResult>;
  openDirectoryDialogue?: () => Promise<OpenDirectoryResult>;
  scanFolder?: (input: ScanFolderInput) => Promise<ScanFolderResult>;
  onScanProgress?: (cb: (p: ScanProgress) => void) => () => void;
  toAudioUrl?: (filePath: string) => string;
  toCoverUrl?: (coverCacheKey: string) => string;
  toPhotoUrl?: (filePath: string) => string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
