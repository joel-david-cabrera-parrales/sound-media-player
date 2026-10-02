import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralSetup } from './general-setup';

describe('GeneralSetup', () => {
  let component: GeneralSetup;
  let fixture: ComponentFixture<GeneralSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
