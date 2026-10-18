import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lyrics } from './lyrics';

describe('Lyrics', () => {
  let component: Lyrics;
  let fixture: ComponentFixture<Lyrics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lyrics],
    }).compileComponents();

    fixture = TestBed.createComponent(Lyrics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
