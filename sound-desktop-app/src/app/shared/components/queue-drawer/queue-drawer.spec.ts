import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueDrawer } from './queue-drawer';

describe('QueueDrawer', () => {
  let component: QueueDrawer;
  let fixture: ComponentFixture<QueueDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(QueueDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
