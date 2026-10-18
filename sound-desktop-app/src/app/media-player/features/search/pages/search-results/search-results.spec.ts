import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { SearchResults } from './search-results';

describe('SearchResults', () => {
  let component: SearchResults;
  let fixture: ComponentFixture<SearchResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResults],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ q: 'm83' }) },
            queryParamMap: of(convertToParamMap({ q: 'm83' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
