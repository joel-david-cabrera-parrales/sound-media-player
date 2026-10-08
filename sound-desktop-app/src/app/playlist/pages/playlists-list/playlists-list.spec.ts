import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { PlaylistsList } from './playlists-list';

describe('PlaylistsList', () => {
  let component: PlaylistsList;
  let fixture: ComponentFixture<PlaylistsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistsList],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
