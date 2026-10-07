import { Component, input, output } from '@angular/core';

/**
 * Corazón de favorito con relleno garantizado.
 * La fuente Material Symbols del proyecto es estática (sin eje FILL),
 * así que el estado liked usa un SVG sólido en color de acento en lugar
 * de confiar en `font-variation-settings`.
 */
@Component({
  selector: 'shared-favorite-button',
  templateUrl: './favorite-button.html',
})
export class FavoriteButton {
  readonly liked = input(false);
  readonly label = input('');
  readonly disabled = input(false);
  /** Clases de layout, siempre aplicadas. */
  readonly buttonClass = input('');
  /** Color en reposo (el liked siempre es acento sólido). */
  readonly idleClass = input(
    'text-slate-400 dark:text-[#6a6a6a] hover:text-[#005575] dark:hover:text-[#00d2ff]',
  );
  readonly iconClass = input('text-[20px]');
  readonly toggled = output<void>();
}
