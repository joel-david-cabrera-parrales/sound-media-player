import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { PlaylistBuilder } from './playlist-builder';

describe('PlaylistBuilder', () => {
  let component: PlaylistBuilder;
  let fixture: ComponentFixture<PlaylistBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistBuilder],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'x' }) },
            paramMap: of(convertToParamMap({ id: 'x' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
