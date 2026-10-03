import { Injectable, computed, inject, signal } from '@angular/core';
import { audioUrlFor, type Track } from '../models/track.model';
import { LocalMusicService } from './local-music.service';

export type RepeatMode = 0 | 1 | 2;

const PLAYER_STATE_KEY = 'sound.player.v1';
const POSITION_SAVE_INTERVAL_MS = 5000;

interface PersistedPlayerState {
  volume01?: unknown;
  muted?: unknown;
  repeatMode?: unknown;
  shuffle?: unknown;
  trackId?: unknown;
  positionSec?: unknown;
}

function describePlayError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (name === 'NotAllowedError') {
    return 'El navegador bloqueó la reproducción automática. Haz clic de nuevo en la canción para reproducirla.';
  }
  if (name === 'NotSupportedError') {
    return 'No se pudo reproducir: el archivo no existe o el formato no es soportado. Reescanea la carpeta y verifica la ruta.';
  }
  if (name === 'AbortError') {
    return 'Reproducción interrumpida. Intenta de nuevo.';
  }
  return `No se pudo reproducir el archivo${message ? `: ${message}` : '. Verifica la ruta y el formato.'}`;
}

function describeMediaError(code: number | undefined): string {
  switch (code) {
    case 2:
      return 'Error de red al leer el archivo (protocolo sound-audio devolvió 404). Reescanea la carpeta.';
    case 3:
      return 'El archivo está corrupto o el códec no es soportado por el navegador.';
    case 4:
      return 'Fuente de audio no soportada. Verifica el formato (MP3/FLAC/M4A/OGG/WAV).';
    default:
      return 'No se pudo reproducir el archivo. Verifica la ruta y el formato.';
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  // Sin ciclo: LocalMusicService no depende del player (solo de TranslationService).
  private readonly library = inject(LocalMusicService);
  private audio: HTMLAudioElement | null = null;
  private pendingResumeSec: number | null = null;
  private restoring = false;
  private lastPersistAt = 0;

  readonly currentTrack = signal<Track | null>(null);
  readonly isPlaying = signal(false);
  readonly currentTimeSec = signal(0);
  readonly durationSec = signal(0);
  readonly error = signal<string | null>(null);

  // Estado propio del dock (antes vivía solo en el componente y se perdía)
  readonly volume01 = signal(0.75);
  readonly muted = signal(false);
  readonly repeatMode = signal<RepeatMode>(0);
  readonly shuffle = signal(false);

  readonly hasTrack = computed(() => this.currentTrack() !== null);

  constructor() {
    this.restore();
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      this.audio.volume = this.volume01();
      this.audio.muted = this.muted();
      this.audio.loop = this.repeatMode() === 2;
      this.audio.addEventListener('timeupdate', () => {
        this.currentTimeSec.set(this.audio?.currentTime ?? 0);
        this.persistThrottled();
      });
      this.audio.addEventListener('loadedmetadata', () => {
        const dur = this.audio?.duration ?? 0;
        this.durationSec.set(Number.isFinite(dur) ? dur : 0);
        if (this.pendingResumeSec != null && this.audio) {
          const pos = Math.min(this.pendingResumeSec, Math.max(0, dur - 2));
          if (pos > 0) {
            this.audio.currentTime = pos;
            this.currentTimeSec.set(pos);
          }
          this.pendingResumeSec = null;
        }
        this.restoring = false;
      });
      this.audio.addEventListener('play', () => this.isPlaying.set(true));
      this.audio.addEventListener('pause', () => {
        this.isPlaying.set(false);
        this.persistNow();
      });
      this.audio.addEventListener('ended', () => {
        this.isPlaying.set(false);
        // Auto-avance con vuelta a la primera (repeat off y all)
        this.next();
      });
      this.audio.addEventListener('error', () => {
        if (this.restoring) {
          // La última sesión apunta a un archivo que ya no existe: vuelta a idle sin ruido
          console.warn('[player] restore fallido, vuelta a idle. src:', this.audio?.src);
          this.restoring = false;
          this.pendingResumeSec = null;
          this.currentTrack.set(null);
          this.currentTimeSec.set(0);
          this.durationSec.set(0);
          return;
        }
        const code = this.audio?.error?.code;
        console.error('[player] error del elemento audio:', code, this.audio?.error, 'src:', this.audio?.src);
        this.error.set(describeMediaError(code));
        this.isPlaying.set(false);
      });
    }
    return this.audio;
  }

  play(track: Track): void {
    const url = audioUrlFor(track);
    if (!url) {
      this.error.set('Sin Electron no hay acceso a la ruta del sistema. Usa el fallback web o abre en Electron.');
      return;
    }
    this.error.set(null);
    this.restoring = false;
    this.pendingResumeSec = null;
    const el = this.ensureAudio();
    // Si es la misma pista, alternar
    if (this.currentTrack()?.id === track.id && el.src) {
      if (el.paused) {
        void el.play().catch((err: unknown) => {
          console.error('[player] play() rechazado:', err, 'src:', el.src);
          this.error.set(describePlayError(err));
        });
      } else {
        el.pause();
      }
      return;
    }
    this.currentTrack.set(track);
    this.currentTimeSec.set(0);
    this.durationSec.set(0);
    el.loop = this.repeatMode() === 2;
    el.src = url;
    el.currentTime = 0;
    void el.play().catch((err: unknown) => {
      console.error('[player] play() rechazado:', err, 'src:', el.src, 'track:', track.filePath);
      this.error.set(describePlayError(err));
    });
    this.persistNow(0);
  }

  toggle(): void {
    const track = this.currentTrack();
    if (!track) return;
    this.play(track);
  }

  /** Siguiente de la cola (toda la librería), con vuelta a la primera. */
  next(): void {
    const queue = this.library.tracks();
    if (queue.length === 0) return;
    const cur = this.currentTrack();
    const idx = cur ? queue.findIndex((t) => t.id === cur.id) : -1;
    let target: Track;
    if (this.shuffle() && queue.length > 1) {
      let i = idx;
      while (i === idx || i < 0) {
        i = Math.floor(Math.random() * queue.length);
      }
      target = queue[i];
    } else {
      target = queue[idx < 0 ? 0 : (idx + 1) % queue.length];
    }
    this.play(target);
  }

  /** Anterior de la cola (secuencial aunque haya shuffle), con vuelta a la última. */
  previous(): void {
    const queue = this.library.tracks();
    if (queue.length === 0) return;
    const cur = this.currentTrack();
    const idx = cur ? queue.findIndex((t) => t.id === cur.id) : -1;
    const target = queue[idx < 0 ? queue.length - 1 : (idx - 1 + queue.length) % queue.length];
    this.play(target);
  }

  seekTo(seconds: number): void {
    if (!this.audio || !this.currentTrack()) return;
    const dur = this.audio.duration;
    const clamped = Math.min(Number.isFinite(dur) ? dur : seconds, Math.max(0, seconds));
    this.audio.currentTime = clamped;
    this.currentTimeSec.set(clamped);
    this.persistNow(clamped);
  }

  setVolume01(value: number): void {
    const v = clamp01(value);
    this.volume01.set(v);
    if (this.audio) this.audio.volume = v;
    if (v > 0 && this.muted()) {
      this.setMuted(false);
      return;
    }
    this.persistNow();
  }

  setMuted(mute: boolean): void {
    this.muted.set(mute);
    if (this.audio) this.audio.muted = mute;
    this.persistNow();
  }

  toggleMute(): void {
    this.setMuted(!this.muted());
  }

  toggleShuffle(): void {
    this.shuffle.update((v) => !v);
    this.persistNow();
  }

  cycleRepeat(): void {
    this.repeatMode.update((v) => ((v + 1) % 3) as RepeatMode);
    if (this.audio) this.audio.loop = this.repeatMode() === 2;
    this.persistNow();
  }

  isCurrent(track: Track): boolean {
    return this.currentTrack()?.id === track.id;
  }

  private persistThrottled(): void {
    const now = Date.now();
    if (now - this.lastPersistAt < POSITION_SAVE_INTERVAL_MS) return;
    this.lastPersistAt = now;
    this.persistNow();
  }

  private persistNow(positionOverride?: number): void {
    try {
      const state = {
        volume01: this.volume01(),
        muted: this.muted(),
        repeatMode: this.repeatMode(),
        shuffle: this.shuffle(),
        trackId: this.currentTrack()?.id ?? null,
        positionSec: Math.floor(positionOverride ?? this.currentTimeSec()),
        updatedAt: Date.now(),
      };
      localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
    } catch {
      // Sin almacenamiento: el estado solo vive en memoria
    }
  }

  private restore(): void {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PLAYER_STATE_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    let s: PersistedPlayerState;
    try {
      s = JSON.parse(raw) as PersistedPlayerState;
    } catch {
      return;
    }
    if (typeof s.volume01 === 'number' && Number.isFinite(s.volume01)) {
      this.volume01.set(clamp01(s.volume01));
    }
    this.muted.set(s.muted === true);
    if (s.repeatMode === 0 || s.repeatMode === 1 || s.repeatMode === 2) {
      this.repeatMode.set(s.repeatMode);
    }
    this.shuffle.set(s.shuffle === true);
    if (typeof s.trackId !== 'string' || !s.trackId) return;
    const track = this.library.tracks().find((t) => t.id === s.trackId) ?? null;
    const pos = typeof s.positionSec === 'number' && Number.isFinite(s.positionSec) ? Math.max(0, s.positionSec) : 0;
    if (!track) return;
    // Restaura la última sesión pausada (sin autoplay: los navegadores lo bloquean).
    // Carga solo metadata para mostrar duración y dejar la posición lista.
    const url = audioUrlFor(track);
    if (!url) return;
    this.currentTrack.set(track);
    this.pendingResumeSec = pos;
    try {
      this.restoring = true;
      this.ensureAudio().src = url;
    } catch {
      this.restoring = false;
      this.pendingResumeSec = null;
      this.currentTrack.set(null);
    }
  }
}

