import { Component, input, output, computed, inject } from '@angular/core';
import { AudioPlayerService } from '../../../media-player/services/audio-player.service';

@Component({
  selector: 'shared-play-button',
  imports: [],
  templateUrl: './play-button.html',
  styleUrl: './play-button.css',
})
export class PlayButton {
  readonly track = input<{ id: string } | null>(null);
  readonly isCurrent = input<boolean>(false);
  readonly isPlaying = input<boolean>(false);
  readonly klass = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly title = input<string>('');

  readonly playClick = output<void>();

  private readonly player = inject(AudioPlayerService);

  protected readonly icon = computed(() => {
    if (this.isCurrent()) return this.isPlaying() ? 'pause' : 'play_circle';
    return this.isPlaying() ? 'pause' : 'play_arrow';
  });

  protected readonly dims = computed(() => {
    switch (this.size()) {
      case 'sm': return 'w-8 h-8 text-lg';
      case 'lg': return 'w-14 h-14 text-3xl';
      default: return 'w-11 h-11 text-2xl';
    }
  });

  protected onClick(event: Event): void {
    event.stopPropagation();
    this.playClick.emit();
  }
}
