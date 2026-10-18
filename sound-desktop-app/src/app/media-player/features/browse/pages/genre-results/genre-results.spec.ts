import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { GenreResults } from './genre-results';

describe('GenreResults', () => {
  let component: GenreResults;
  let fixture: ComponentFixture<GenreResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreResults],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'electronic' }) },
            paramMap: of(convertToParamMap({ id: 'electronic' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
