import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * Pipe PURO de tiempo relativo ("hace 5 minutos").
 * Debe ser puro a propósito: `formatLastScan` usa `Date.now()` y llamarlo
 * como método en el template cambia de valor entre checks de Angular
 * (NG0100), sobre todo con el `timeupdate` del reproductor disparando
 * change detection cada segundo. Al ser puro, solo se recalcula cuando
 * cambia `lastScanIso` (es decir, al reescanear).
 * Nota: por la misma razón no se actualiza solo con el paso del tiempo
 * ni al cambiar de idioma hasta el próximo rescan.
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.round((then - Date.now()) / 1000);
    const lang = this.i18n.currentLang();
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    return rtf.format(Math.round(diffSec / 86400), 'day');
  }
}
