export interface OpenFileResult {
  canceled: boolean;
  filePath: string | null;
}

export interface OpenDirectoryResult {
  canceled: boolean;
  dirPath: string | null;
}

export interface ElectronAPI {
  openFileDialogue: () => Promise<OpenFileResult>;
  openDirectoryDialogue?: () => Promise<OpenDirectoryResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
