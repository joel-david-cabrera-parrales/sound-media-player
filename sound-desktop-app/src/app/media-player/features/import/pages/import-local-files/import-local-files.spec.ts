import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ImportLocalFiles } from './import-local-files';

describe('ImportLocalFiles', () => {
  let component: ImportLocalFiles;
  let fixture: ComponentFixture<ImportLocalFiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportLocalFiles],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
            data: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportLocalFiles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
