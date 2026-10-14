import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PROFILE_STORAGE_KEY } from '../../shared/utils/profile-photo';

export { PROFILE_STORAGE_KEY };

interface StoredProfile {
  done?: unknown;
  skipped?: unknown;
  name?: unknown;
  birthdate?: unknown;
}

function readProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as StoredProfile;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function isValidBirthdate(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

/** Perfil completo: omitido o con done + nombre y fecha válidos. */
export function isProfileComplete(): boolean {
  const data = readProfile();
  if (data.skipped === true) return true;
  if (data.done !== true) return false;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length < 3) return false;
  return isValidBirthdate(data.birthdate);
}

export const profileSetupGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (isProfileComplete()) {
    return router.parseUrl('/welcome/general-setup');
  }

  return true;
};

/** Exige onboarding completo; si no, devuelve al initial-setup sin romper el flujo welcome inicial. */
export const requireProfileGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (isProfileComplete()) return true;
  return router.parseUrl('/welcome/initial-setup');
};
