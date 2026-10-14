import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import {
  DEFAULT_AVATAR,
  PROFILE_STORAGE_KEY,
  migrateLegacyPhotoUrl,
} from '../utils/profile-photo';
import { TranslationService } from './translation.service';

export interface ProfilePatch {
  name?: string;
  birthdate?: string;
  /** string: guarda foto; null: elimina foto; undefined: no toca foto */
  photo?: string | null;
}

/**
 * Fuente única de verdad del perfil (`sound.profile`) con signals compartidos.
 * Topbar y Settings lo consumen para que la foto/nombre se sincronicen sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly i18n = inject(TranslationService);

  readonly name = signal('');
  readonly birthdate = signal('');
  /** URL cruda migrada o null si no hay foto. */
  readonly photo = signal<string | null>(null);

  readonly displayName = computed(() => this.name().trim() || 'Sound');
  readonly firstName = computed(() => {
    const trimmed = this.name().trim();
    return trimmed ? trimmed.split(/\s+/)[0] : this.i18n.translate('common.fallbackName');
  });
  readonly avatarUrl = computed<SafeUrl | string>(() => {
    const photo = this.photo();
    if (!photo) return DEFAULT_AVATAR;
    // Valida el esquema antes de bypassSecurityTrustUrl.
    if (
      photo.startsWith('sound-photo:') ||
      photo.startsWith('data:') ||
      photo.startsWith('blob:') ||
      photo.startsWith('http')
    ) {
      return this.sanitizer.bypassSecurityTrustUrl(photo);
    }
    return DEFAULT_AVATAR;
  });

  constructor() {
    this.refresh();
    try {
      window.addEventListener('storage', this.onStorage);
    } catch {
      // Sin window (SSR): se queda el valor inicial
    }
  }

  ngOnDestroy(): void {
    try {
      window.removeEventListener('storage', this.onStorage);
    } catch {
      // Sin window: se ignora
    }
  }

  /** Handler nombrado para poder remover el listener en ngOnDestroy. */
  private readonly onStorage = (): void => this.refresh();

  /** Relee localStorage y actualiza los signals (incluye migración legacy). */
  refresh(): void {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const name = typeof data['name'] === 'string' ? data['name'] : '';
      const birthdate = typeof data['birthdate'] === 'string' ? data['birthdate'] : '';
      const photoRaw = typeof data['photo'] === 'string' && data['photo'] ? data['photo'] : null;
      const migrated = migrateLegacyPhotoUrl(photoRaw);
      if (migrated && migrated !== photoRaw) {
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...data, photo: migrated }));
        } catch {
          // cuota: se usa en memoria
        }
      }
      this.name.set(name);
      this.birthdate.set(birthdate);
      this.photo.set(migrated);
    } catch {
      this.name.set('');
      this.birthdate.set('');
      this.photo.set(null);
    }
  }

  /** Fusiona el patch con el perfil guardado (preserva settings/idioma) y notifica vía signals. */
  updateProfile(patch: ProfilePatch): void {
    const current = this.readRaw();
    const next: Record<string, unknown> = { ...current };
    if (patch.name !== undefined) next['name'] = patch.name.trim();
    if (patch.birthdate !== undefined) next['birthdate'] = patch.birthdate;
    if (patch.photo !== undefined) {
      if (typeof patch.photo === 'string' && patch.photo) next['photo'] = patch.photo;
      else delete next['photo'];
    }
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento: solo vive en memoria
    }
    this.refresh();
  }

  private readRaw(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      return raw ? ((JSON.parse(raw) as Record<string, unknown>) ?? {}) : {};
    } catch {
      return {};
    }
  }
}
