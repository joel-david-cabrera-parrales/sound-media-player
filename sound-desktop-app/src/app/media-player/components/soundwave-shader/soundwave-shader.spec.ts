import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundwaveShader } from './soundwave-shader';

describe('SoundwaveShader', () => {
  let component: SoundwaveShader;
  let fixture: ComponentFixture<SoundwaveShader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoundwaveShader],
    }).compileComponents();

    fixture = TestBed.createComponent(SoundwaveShader);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
