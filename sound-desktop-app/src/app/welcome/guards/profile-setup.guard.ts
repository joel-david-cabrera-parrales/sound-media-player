import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PROFILE_STORAGE_KEY } from '../../shared/utils/profile-photo';

export { PROFILE_STORAGE_KEY };

export const profileSetupGuard: CanActivateFn = () => {
  const router = inject(Router);

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { done?: boolean; skipped?: boolean };
      if (data && (data.done === true || data.skipped === true)) {
        return router.parseUrl('/welcome/general-setup');
      }
    }
  } catch {
    return true;
  }

  return true;
};
