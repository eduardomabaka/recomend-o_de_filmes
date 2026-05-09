import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieDetailsDialog } from './movie-details-dialog';

describe('MovieDetailsDialog', () => {
  let component: MovieDetailsDialog;
  let fixture: ComponentFixture<MovieDetailsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetailsDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieDetailsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
