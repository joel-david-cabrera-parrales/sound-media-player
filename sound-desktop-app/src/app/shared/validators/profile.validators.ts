import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Nombre y apellido (≥2 palabras, solo letras). Devuelve códigos i18n. */
export function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null;
  const parts = value.split(/\s+/);
  if (parts.length < 2) {
    return { fullName: 'nameTwoWords' };
  }
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]+$/.test(value)) {
    return { fullName: 'nameLetters' };
  }
  return null;
}

/** Fecha no futura. Devuelve códigos i18n. */
export function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { birthdate: 'birthInvalid' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { birthdate: 'birthFuture' };
  }
  return null;
}
