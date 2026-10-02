import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { InitialSetup } from './initial-setup';

describe('InitialSetup', () => {
  let component: InitialSetup;
  let fixture: ComponentFixture<InitialSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitialSetup],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(InitialSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
