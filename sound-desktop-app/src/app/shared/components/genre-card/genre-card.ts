import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CoverService } from '../../services/cover.service';

@Component({
  selector: 'shared-genre-card',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './genre-card.html',
  styleUrl: './genre-card.css',
})
export class GenreCard {
  readonly id = input<string>('');
  readonly label = input<string>('');
  readonly count = input<number>(0);
  readonly cover = input<string>('');
  readonly bg = input<string>('');
  readonly glow = input<string>('');
  readonly tint = input<string>('');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly coverService = inject(CoverService);

  protected readonly coverUrl = computed<string | SafeUrl | null>(() => {
    const c = this.cover();
    if (!c) return null;
    return c.startsWith('sound-cover:')
      ? this.sanitizer.bypassSecurityTrustUrl(c)
      : c;
  });

  protected readonly cardClass = computed(() => {
    const bg = this.bg();
    const glow = this.glow();
    return `h-28 rounded-xl p-4 relative overflow-hidden border border-slate-200 dark:border-white/[0.08] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] flex flex-col justify-between shadow-sm dark:shadow-none transition-all cursor-pointer group ${bg} ${glow}`;
  });

  protected readonly textClass = computed(() => {
    const tint = this.tint();
    const ink = 'text-slate-900 dark:text-white';
    return `text-[20px] leading-[26px] font-bold z-10 truncate transition-colors ${tint} ${ink}`;
  });

  protected readonly countClass = computed(() => {
    const tint = this.tint();
    return `text-[11px] leading-[14px] font-semibold z-10 flex items-center gap-1 ${tint}`;
  });
}
