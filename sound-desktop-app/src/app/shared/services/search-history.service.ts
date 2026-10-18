import { Injectable, inject, signal } from '@angular/core';

const SEARCH_HISTORY_KEY = 'sound.searchHistory';
const HISTORY_MAX = 8;

export interface SearchHistoryEntry {
  text: string;
  kind: 'track' | 'artist' | 'genre';
  refId: string | null;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly history = signal<SearchHistoryEntry[]>(this.loadHistory());

  readonly entries = this.history.asReadonly();

  /** Carga el historial desde localStorage con validación y límite. */
  private loadHistory(): SearchHistoryEntry[] {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<SearchHistoryEntry>[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (e) =>
            e &&
            typeof e.text === 'string' &&
            (e.kind === 'track' || e.kind === 'artist' || e.kind === 'genre'),
        )
        .map((e) => ({
          text: e.text as string,
          kind: e.kind as SearchHistoryEntry['kind'],
          refId: typeof e.refId === 'string' ? e.refId : null,
          ts: typeof e.ts === 'number' ? e.ts : 0,
        }))
        .slice(0, HISTORY_MAX);
    } catch {
      return [];
    }
  }

  /** Persiste el historial actual en localStorage. */
  private persistHistory(): void {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.history()));
    } catch {
      // Sin almacenamiento: el historial solo vive en memoria
    }
  }

  /** Añade o actualiza una entrada al historial (máximo HISTORY_MAX). */
  remember(entry: Omit<SearchHistoryEntry, 'ts'>): void {
    this.history.update((list) => {
      const next = [
        { ...entry, ts: Date.now() },
        ...list.filter(
          (e) => !(e.text === entry.text && e.kind === entry.kind),
        ),
      ];
      return next.slice(0, HISTORY_MAX);
    });
    this.persistHistory();
  }

  /** Elimina una entrada específica del historial. */
  remove(entry: SearchHistoryEntry): void {
    this.history.update((list) =>
      list.filter(
        (e) =>
          !(e.text === entry.text && e.kind === entry.kind && e.refId === entry.refId),
      ),
    );
    this.persistHistory();
  }

  /** Limpia todo el historial. */
  clear(): void {
    this.history.set([]);
    this.persistHistory();
  }

  /** Recarga el historial desde localStorage (útil ante cambios externos). */
  reload(): void {
    this.history.set(this.loadHistory());
  }
}
