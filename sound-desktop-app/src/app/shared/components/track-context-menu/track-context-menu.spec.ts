import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackContextMenu } from './track-context-menu';

describe('TrackContextMenu', () => {
  let component: TrackContextMenu;
  let fixture: ComponentFixture<TrackContextMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackContextMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackContextMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
