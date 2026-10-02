import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeApp } from './welcome-app';

describe('WelcomeApp', () => {
  let component: WelcomeApp;
  let fixture: ComponentFixture<WelcomeApp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeApp],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeApp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
