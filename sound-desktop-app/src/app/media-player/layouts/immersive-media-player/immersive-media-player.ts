import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MediaControlBar } from '../../../shared/components/media-control-bar/media-control-bar';

@Component({
  selector: 'media-player-immersive-layout',
  imports: [RouterOutlet, MediaControlBar],
  templateUrl: './immersive-media-player.html',
  styleUrl: './immersive-media-player.css',
})
export class ImmersiveMediaPlayerLayout {}
