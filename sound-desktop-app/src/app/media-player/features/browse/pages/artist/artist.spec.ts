import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Artist } from './artist';

describe('Artist', () => {
  let component: Artist;
  let fixture: ComponentFixture<Artist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Artist],
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

    fixture = TestBed.createComponent(Artist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
