import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LikedSongs } from './liked-songs';

describe('LikedSongs', () => {
  let component: LikedSongs;
  let fixture: ComponentFixture<LikedSongs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikedSongs],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(LikedSongs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
