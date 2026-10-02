import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PROFILE_STORAGE_KEY } from '../../guards/profile-setup.guard';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

function fullNameValidator(control: AbstractControl): ValidationErrors | null {
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

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const DEFAULT_AVATAR = '/images/avatar-default.svg';

function toSoundPhotoUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const encoded = encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F');
  return `sound-photo:///${encoded}`;
}

function readStoredProfile(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
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

@Component({
  selector: 'welcome-initial-setup',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './initial-setup.html',
  styleUrl: './initial-setup.css',
})
export class InitialSetup {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  protected readonly maxDate: string = new Date().toISOString().slice(0, 10);
  protected readonly defaultAvatar = DEFAULT_AVATAR;

  protected photoUrl: string | null = null;
  protected safePhotoUrl: SafeUrl = DEFAULT_AVATAR;
  protected photoError: string | null = null;

  constructor() {
    const stored = readStoredProfile();
    if (typeof stored['photo'] === 'string' && stored['photo']) {
      this.photoUrl = stored['photo'] as string;
    }
    this.updateSafePhoto();
  }

  private updateSafePhoto(): void {
    this.safePhotoUrl = this.photoUrl
      ? this.sanitizer.bypassSecurityTrustUrl(this.photoUrl)
      : DEFAULT_AVATAR;
  }

  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), fullNameValidator],
    }),
    birthdate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, pastDateValidator],
    }),
  });

  protected async onEditPhoto(): Promise<void> {
    this.photoError = null;
    const electronAPI = window.electronAPI;
    if (electronAPI) {
      const result = await electronAPI.openFileDialogue();
      if (result.canceled || !result.filePath) return;
      this.photoUrl = toSoundPhotoUrl(result.filePath);
      this.updateSafePhoto();
      return;
    }
    this.fileInput?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    this.photoError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.photoError = 'photoType';
      input.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError = 'photoSize';
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.photoUrl = reader.result as string;
      this.updateSafePhoto();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected onPhotoError(): void {
    if (this.photoUrl && this.photoUrl !== DEFAULT_AVATAR) {
      this.photoUrl = null;
      this.updateSafePhoto();
    }
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, birthdate } = this.form.getRawValue();
    const profile: Record<string, unknown> = {
      ...readStoredProfile(),
      name: fullName.trim(),
      birthdate,
      skipped: false,
      done: true,
    };
    if (this.photoUrl) {
      profile['photo'] = this.photoUrl;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    this.router.navigate(['/welcome/general-setup']);
  }

  protected onSkip(): void {
    const profile: Record<string, unknown> = {
      ...readStoredProfile(),
      skipped: true,
      done: true,
    };
    if (this.photoUrl) {
      profile['photo'] = this.photoUrl;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    this.router.navigate(['/welcome/general-setup']);
  }
}
