import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeLayout } from '../layouts/welcome-layout';

describe('WelcomeLayout', () => {
  let component: WelcomeLayout;
  let fixture: ComponentFixture<WelcomeLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
