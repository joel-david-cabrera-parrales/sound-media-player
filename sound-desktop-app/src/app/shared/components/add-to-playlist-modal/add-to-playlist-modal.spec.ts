import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToPlayListModal } from './add-to-playlist-modal';

describe('AddToPlayListModal', () => {
  let component: AddToPlayListModal;
  let fixture: ComponentFixture<AddToPlayListModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToPlayListModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddToPlayListModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
