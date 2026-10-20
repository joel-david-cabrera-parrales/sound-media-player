import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, computed } from '@angular/core';

import { GeneralSetup } from './general-setup';
import { SyncService } from '../../../shared/services/sync.service';

describe('GeneralSetup', () => {
  let component: GeneralSetup;
  let fixture: ComponentFixture<GeneralSetup>;
  let runSyncCalls = 0;
  let skipCalls = 0;
  let navigateCalls: any[] = [];

  const syncServiceStub: any = {
    syncing: signal(false),
    syncProgress: signal<{ done: number; total: number } | null>(null),
    syncError: signal<string | null>(null),
    syncPercent: computed(() => 0),
    syncedTracks: computed(() => 0),
    runSync: async () => {
      runSyncCalls++;
    },
    skip: () => {
      skipCalls++;
    },
  };

  const routerStub: any = {
    navigate: (...args: any[]) => {
      navigateCalls.push(args);
      return Promise.resolve(true);
    },
  };

  beforeEach(async () => {
    runSyncCalls = 0;
    skipCalls = 0;
    navigateCalls = [];

    await TestBed.configureTestingModule({
      imports: [GeneralSetup],
      providers: [
        { provide: SyncService, useValue: syncServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start sync on init', () => {
    expect(runSyncCalls).toBeGreaterThan(0);
  });

  it('should navigate to library on skip', () => {
    component.skipScan();
    expect(skipCalls).toBeGreaterThan(0);
    expect(navigateCalls).toContainEqual([['/media-player']]);
  });
});
