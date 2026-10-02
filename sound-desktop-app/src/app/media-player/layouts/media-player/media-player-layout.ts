import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { MediaControlBar } from '../../../shared/components/media-control-bar/media-control-bar';

@Component({
  selector: 'media-player-layout',
  imports: [RouterOutlet, Sidebar, Topbar, MediaControlBar],
  templateUrl: './media-player-layout.html',
  styleUrl: './media-player-layout.css',
})
export class MediaPlayerLayout {}
