import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MovieService } from '../../core/movie.service';
import { AuthService } from '../../core/auth.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { MovieDetailsDialog } from '../../shared/movie-details-dialog/movie-details-dialog';
import type { TmdbMovie } from '../../core/api.types';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, MovieCardComponent],
  templateUrl: './search.page.html',
  styleUrl: './search.page.scss'
})
export class SearchPage {
  q = '';
  protected readonly page = signal(1);
  protected readonly lang = signal<'pt-PT' | 'en-US'>('pt-PT');
  protected readonly favoriteIds = signal<number[]>([]);

  protected readonly vm$ = computed(() => {
    const q = this.q.trim();
    if (!q) return null;
    return this.movies.search({ q, page: this.page(), lang: this.lang() });
  });

  constructor(private readonly movies: MovieService, protected readonly auth: AuthService, private readonly dialog: MatDialog) {
    if (this.auth.isLoggedIn()) {
      this.loadFavorites();
    }
  }

  submit() {
    this.page.set(1);
  }

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
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

