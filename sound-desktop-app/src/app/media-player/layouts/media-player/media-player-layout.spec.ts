import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { of } from 'rxjs';

import { MediaPlayerLayout } from './media-player-layout';

describe('MediaPlayerLayout', () => {
  let component: MediaPlayerLayout;
  let fixture: ComponentFixture<MediaPlayerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPlayerLayout],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
            events: of(new NavigationStart(1, '/')),
          },
        },
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

    fixture = TestBed.createComponent(MediaPlayerLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
