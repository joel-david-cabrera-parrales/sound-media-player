export interface OpenFileResult {
  canceled: boolean;
  filePath: string | null;
}

export interface ElectronAPI {
  openFileDialogue: () => Promise<OpenFileResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
