import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Lyrics } from './lyrics';

describe('Lyrics', () => {
  let component: Lyrics;
  let fixture: ComponentFixture<Lyrics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lyrics],
      providers: [
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

    fixture = TestBed.createComponent(Lyrics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
