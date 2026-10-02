import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MediaPlayerLayout } from './media-player-layout';

describe('MediaPlayerLayout', () => {
  let component: MediaPlayerLayout;
  let fixture: ComponentFixture<MediaPlayerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPlayerLayout],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaPlayerLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
