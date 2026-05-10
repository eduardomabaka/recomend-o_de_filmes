import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MovieService } from '../../core/movie.service';
import { AuthService } from '../../core/auth.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { MovieDetailsDialog } from '../../shared/movie-details-dialog/movie-details-dialog';
import type { TmdbMovie, TmdbPagedResponse } from '../../core/api.types';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [FormsModule, MovieCardComponent],
  templateUrl: './search.page.html',
  styleUrl: './search.page.scss'
})
export class SearchPage {
  protected readonly q = signal('');
  protected readonly lang = signal<'pt-PT' | 'en-US'>('pt-PT');
  protected readonly favoriteIds = signal<number[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<TmdbPagedResponse<TmdbMovie> | null>(null);

  constructor(private readonly movies: MovieService, protected readonly auth: AuthService, private readonly dialog: MatDialog) {
    if (this.auth.isLoggedIn()) {
      this.loadFavorites();
    }
  }

  submit() {
    const query = this.q().trim();
    this.results.set(null);
    this.error.set(null);
    if (!query) {
      return;
    }

    this.loading.set(true);
    this.movies.search({ q: query, lang: this.lang() }).subscribe((res) => {
      this.loading.set(false);
      if (res.error) {
        this.results.set(null);
        this.error.set(res.error);
        return;
      }

      let payload = res;
      if (Array.isArray(payload.results)) {
        const exactMatches = payload.results.filter((movie) =>
          (movie.title ?? '').toLowerCase() === query.toLowerCase()
        );

        if (exactMatches.length === 1) {
          payload = {
            ...payload,
            results: exactMatches,
            total_results: exactMatches.length
          };
        }
      }

      this.results.set(payload);
    }, () => {
      this.loading.set(false);
      this.error.set('Erro ao pesquisar.');
      this.results.set(null);
    });
  }

  private loadFavorites(): void {
    this.movies.favorites().subscribe((res) => {
      if (res.error) {
        return;
      }
      if (Array.isArray(res.favorites)) {
        this.favoriteIds.set(res.favorites.map((item) => item.tmdb_movie_id));
      }
    });
  }

  private updateFavoriteState(movieId: number, active: boolean): void {
    this.favoriteIds.update((current) => {
      if (active) {
        return current.includes(movieId) ? current : [...current, movieId];
      }
      return current.filter((id) => id !== movieId);
    });
  }

  onFavoriteToggle(movie: { id: number }) {
    const isFavorite = this.favoriteIds().includes(movie.id);
    if (isFavorite) {
      this.movies.removeFavorite({ tmdb_movie_id: movie.id }).subscribe((res) => {
        if (!res.error) {
          this.updateFavoriteState(movie.id, false);
        }
      });
      return;
    }

    this.movies.addFavorite({ tmdb_movie_id: movie.id }).subscribe((res) => {
      if (!res.error) {
        this.updateFavoriteState(movie.id, true);
      }
    });
  }

  onMovieClick(movie: TmdbMovie) {
    this.dialog.open(MovieDetailsDialog, {
      data: { movie, overlayMode: true, maxPlatforms: 4 },
      width: 'min(92vw, 640px)',
      maxWidth: '96vw',
      backdropClass: 'dialog-transparent-backdrop',
      panelClass: 'dialog-glass-surface'
    });
  }
}

