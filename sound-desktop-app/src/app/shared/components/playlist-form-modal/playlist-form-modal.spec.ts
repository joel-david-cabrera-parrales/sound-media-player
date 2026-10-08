import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistFormModal } from './playlist-form-modal';

describe('PlaylistFormModal', () => {
  let component: PlaylistFormModal;
  let fixture: ComponentFixture<PlaylistFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create in create mode', () => {
    expect(component).toBeTruthy();
  });
});
