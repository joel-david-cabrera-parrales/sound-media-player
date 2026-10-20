import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ImmersiveMediaPlayerLayout } from './immersive-media-player';

describe('ImmersiveMediaPlayer', () => {
  let component: ImmersiveMediaPlayerLayout;
  let fixture: ComponentFixture<ImmersiveMediaPlayerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmersiveMediaPlayerLayout],
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

    fixture = TestBed.createComponent(ImmersiveMediaPlayerLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
