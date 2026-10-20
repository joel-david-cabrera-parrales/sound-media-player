import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ImmersiveMusicPlayer } from './immersive-music-player';

describe('ImmersiveMusicPlayer', () => {
  let component: ImmersiveMusicPlayer;
  let fixture: ComponentFixture<ImmersiveMusicPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmersiveMusicPlayer],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
            data: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImmersiveMusicPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
