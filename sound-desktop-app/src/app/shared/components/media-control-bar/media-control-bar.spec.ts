import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MediaControlBar } from './media-control-bar';

describe('MediaControlBar', () => {
  let component: MediaControlBar;
  let fixture: ComponentFixture<MediaControlBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaControlBar],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaControlBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
