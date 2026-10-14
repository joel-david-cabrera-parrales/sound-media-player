import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { fullNameValidator, pastDateValidator } from '../../../shared/validators/profile.validators';
import { ProfileService } from '../../../shared/services/profile.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { ACCENTS, type AccentId, type ThemeMode } from '../../../shared/models/user-settings';
import { TranslationService } from '../../../shared/services/translation.service';
import type { AppLanguage } from '../../../shared/utils/profile-language';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const DEFAULT_AVATAR = '/images/avatar-default.svg';

@Component({
  selector: 'media-player-settings',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly themeService = inject(ThemeService);
  private readonly i18n = inject(TranslationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly profile = inject(ProfileService);

  protected readonly theme = this.themeService.theme;
  protected readonly accent = this.themeService.accent;
  protected readonly accents = ACCENTS;
  protected readonly lang = this.i18n.currentLang;

  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;

  protected readonly maxDate: string = new Date().toISOString().slice(0, 10);
  protected readonly saved = signal(false);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  protected photoUrl: string | null = null;
  protected safePhotoUrl: SafeUrl = DEFAULT_AVATAR;
  protected photoError: string | null = null;

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

  constructor() {
    this.form.controls.fullName.setValue(this.profile.name());
    this.form.controls.birthdate.setValue(this.profile.birthdate());
    this.photoUrl = this.profile.photo();
    this.updateSafePhoto();
  }

  private updateSafePhoto(): void {
    this.safePhotoUrl = this.photoUrl
      ? this.sanitizer.bypassSecurityTrustUrl(this.photoUrl)
      : DEFAULT_AVATAR;
  }

  protected async pickPhoto(): Promise<void> {
    this.photoError = null;
    const api = window.electronAPI;
    if (api?.openFileDialogue) {
      const result = await api.openFileDialogue();
      if (result.canceled || !result.filePath) return;
      const normalized = result.filePath.replace(/\\/g, '/');
      this.photoUrl = `sound-photo://photo?path=${encodeURIComponent(normalized)}`;
      this.updateSafePhoto();
      return;
    }
    this.photoInput?.nativeElement.click();
  }

  protected onPhotoPicked(event: Event): void {
    this.photoError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.photoError = 'type';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError = 'size';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.photoUrl = reader.result as string;
      this.updateSafePhoto();
    };
    reader.readAsDataURL(file);
  }

  protected onPhotoError(): void {
    if (this.photoUrl && this.photoUrl !== DEFAULT_AVATAR) {
      this.photoUrl = null;
      this.updateSafePhoto();
    }
  }

  protected setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  protected setAccent(id: AccentId): void {
    this.themeService.setAccent(id);
  }

  protected setLanguage(lang: AppLanguage): void {
    this.i18n.setLanguage(lang);
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, birthdate } = this.form.getRawValue();
    this.profile.updateProfile({
      name: fullName.trim(),
      birthdate,
      photo: this.photoUrl,
    });
    this.saved.set(true);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saved.set(false), 2500);
  }
}
