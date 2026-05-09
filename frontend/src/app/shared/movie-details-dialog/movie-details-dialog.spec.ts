import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import { MovieDetailsDialog } from './movie-details-dialog';
import { MovieService } from '../../core/movie.service';

describe('MovieDetailsDialog', () => {
  let component: MovieDetailsDialog;
  let fixture: ComponentFixture<MovieDetailsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetailsDialog],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { movie: { id: 1, title: 'Filme teste' }, overlayMode: false }
        },
        {
          provide: MovieService,
          useValue: {
            details: () => of({ id: 1, title: 'Filme teste' }),
            watchProviders: () => of({ id: 1, results: {} })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovieDetailsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
