import { TestBed } from '@angular/core/testing';
import { TrackMenuService } from './track-menu.service';
import type { Track } from '../../../media-player/models/track.model';

const TRACK = {
  id: 't1',
  folderId: 'f1',
  filePath: '/music/a.mp3',
  title: 'Song A',
  artist: 'Artist',
  album: 'Album',
  genre: null,
  year: null,
  trackNo: null,
  durationSec: 200,
  format: 'MP3',
  codec: null,
  bitrateKbps: null,
  sampleRateHz: null,
  bitsPerSample: null,
  sizeBytes: 1000,
  coverCacheKey: null,
  hiRes: false,
  objectUrl: null,
} as Track;

describe('TrackMenuService', () => {
  let service: TrackMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackMenuService);
  });

  it('should open and close the menu', () => {
    const event = { stopPropagation: () => undefined } as unknown as MouseEvent;
    service.openMenu(TRACK, event);
    expect(service.menu()?.track.id).toBe('t1');
    service.closeMenu();
    expect(service.menu()).toBeNull();
  });

  it('should open assign and close the menu', () => {
    const event = { stopPropagation: () => undefined } as unknown as MouseEvent;
    service.openMenu(TRACK, event);
    service.openAssign();
    expect(service.menu()).toBeNull();
    expect(service.assignOpen()).toBeTrue();
    service.closeAssign();
    expect(service.assignOpen()).toBeFalse();
  });

  it('should queue a track and toast', () => {
    service.queueTrack(TRACK);
    expect(service.toast()).toContain('Song A');
  });
});
