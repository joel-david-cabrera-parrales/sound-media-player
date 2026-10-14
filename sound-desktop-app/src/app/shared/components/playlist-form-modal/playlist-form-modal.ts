import { Component, ElementRef, ViewChild, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { migrateLegacyPhotoUrl } from '../../utils/profile-photo';

export interface PlaylistFormValue {
  name: string;
  description: string;
  coverUrl: string | null;
}

const DEFAULT_COVER = '/images/track-cover.svg';
const MAX_COVER_BYTES = 4 * 1024 * 1024;

function toSoundPhotoUrl(filePath: string): string {
  const api = window.electronAPI as unknown as { toPhotoUrl?: (p: string) => string } | undefined;
  if (api?.toPhotoUrl) {
    try {
      return api.toPhotoUrl(filePath);
    } catch {
      // fallback local
    }
  }
  const normalized = filePath.replace(/\\/g, '/');
  return `sound-photo://photo?path=${encodeURIComponent(normalized)}`;
}

@Component({
  selector: 'shared-playlist-form-modal',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './playlist-form-modal.html',
  styleUrl: './playlist-form-modal.css',
})
export class PlaylistFormModal {
  /** null = modo crear; con valor = modo editar. */
  readonly initial = input<PlaylistFormValue | null>(null);
  readonly saved = output<PlaylistFormValue>();
  readonly closed = output<void>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly name = linkedSignal(() => this.initial()?.name ?? '');
  protected readonly description = linkedSignal(() => this.initial()?.description ?? '');
  protected readonly coverUrl = linkedSignal<string | null>(() => migrateLegacyPhotoUrl(this.initial()?.coverUrl) ?? this.initial()?.coverUrl ?? null);
  protected readonly touched = signal(false);
  protected readonly coverError = signal<string | null>(null);

  @ViewChild('coverInput') private coverInput?: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      // Solo resetea el flag cuando cambia la referencia memoizada de initial.
      void this.initial();
      this.touched.set(false);
      this.coverError.set(null);
    });
  }

  protected get isEdit(): boolean {
    return this.initial() !== null;
  }

  protected coverPreview(): SafeUrl | string {
    const url = this.coverUrl();
    if (!url) return DEFAULT_COVER;
    if (url.startsWith('sound-photo:') || url.startsWith('data:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

  protected get valid(): boolean {
    return this.name().trim().length >= 3;
  }

  protected async pickCover(): Promise<void> {
    const api = window.electronAPI;
    if (api?.openFileDialogue) {
      const result = await api.openFileDialogue();
      if (!result.canceled && result.filePath) {
        this.coverUrl.set(toSoundPhotoUrl(result.filePath));
      }
      return;
    }
    this.coverInput?.nativeElement.click();
  }

  protected onCoverPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_COVER_BYTES) {
      this.coverError.set('photoSize');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.coverUrl.set(reader.result as string);
    reader.onerror = () => this.coverError.set('photoType');
    reader.onabort = () => this.coverError.set('photoType');
    reader.readAsDataURL(file);
  }

  protected onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(DEFAULT_COVER)) img.src = DEFAULT_COVER;
  }

  protected save(): void {
    this.touched.set(true);
    if (!this.valid) return;
    this.saved.emit({
      name: this.name().trim(),
      description: this.description().trim(),
      coverUrl: this.coverUrl(),
    });
  }

  protected close(): void {
    this.closed.emit();
  }
}
