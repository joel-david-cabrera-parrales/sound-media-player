import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ImmersiveMusicPlayer } from './immersive-music-player';

describe('ImmersiveMusicPlayer', () => {
  let component: ImmersiveMusicPlayer;
  let fixture: ComponentFixture<ImmersiveMusicPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmersiveMusicPlayer],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImmersiveMusicPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
