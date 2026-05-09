import { Component, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MovieService } from '../../core/movie.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { MovieDetailsDialog } from '../../shared/movie-details-dialog/movie-details-dialog';
import type { TmdbMovieDetails } from '../../core/api.types';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [MovieCardComponent, MatDialogModule],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.scss'
})
export class FavoritesPage {
  protected readonly favorites = signal<TmdbMovieDetails[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly removingIds = signal<number[]>([]);

  constructor(
    private readonly movies: MovieService,
    private readonly dialog: MatDialog
  ) {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.loading.set(true);
    this.error.set('');
    this.movies.favorites().subscribe((res) => {
      this.loading.set(false);
      if (res.error) {
        this.error.set(res.error);
        return;
      }

      const ids = Array.isArray(res.favorites) ? res.favorites.map((item) => item.tmdb_movie_id) : [];
      if (ids.length === 0) {
        this.favorites.set([]);
        return;
      }

      const requests = ids.map((id) =>
        this.movies.details({ movieId: id, lang: 'pt-PT' }).pipe(
          catchError(() => of(null))
        )
      );

      forkJoin(requests).subscribe((movies) => {
        this.favorites.set(movies.filter((movie): movie is TmdbMovieDetails => movie !== null));
      });
    });
  }

  protected onMovieClick(movie: TmdbMovieDetails): void {
    this.dialog.open(MovieDetailsDialog, {
      data: { movie, overlayMode: true, maxPlatforms: 4 },
      width: 'min(92vw, 640px)',
      maxWidth: '96vw',
      backdropClass: 'dialog-transparent-backdrop',
      panelClass: 'dialog-glass-surface'
    });
  }

  protected onFavoriteToggle(movie: TmdbMovieDetails): void {
    this.removingIds.update((current) => [...current, movie.id]);
    this.movies.removeFavorite({ tmdb_movie_id: movie.id }).subscribe((res) => {
      this.removingIds.update((current) => current.filter((id) => id !== movie.id));
      if (!res.error) {
        this.favorites.update((current) => current.filter((item) => item.id !== movie.id));
      }
    });
  }

  protected isRemoving(id: number): boolean {
    return this.removingIds().includes(id);
  }
}

