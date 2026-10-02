import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialSetup } from './initial-setup';

describe('InitialSetup', () => {
  let component: InitialSetup;
  let fixture: ComponentFixture<InitialSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitialSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(InitialSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
