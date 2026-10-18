import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'shared-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  readonly icon = input<string>('library_music');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly ctaLabel = input<string>('');
  readonly ctaLink = input<string>('');
  readonly ctaClass = input<string>('');
  readonly iconClass = input<string>('');
}
