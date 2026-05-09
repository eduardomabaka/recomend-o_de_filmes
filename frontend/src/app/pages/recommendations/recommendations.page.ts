import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MovieService } from '../../core/movie.service';
import { AuthService } from '../../core/auth.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { MovieDetailsDialog } from '../../shared/movie-details-dialog/movie-details-dialog';
import type { TmdbMovie } from '../../core/api.types';

@Component({
  selector: 'app-recommendations-page',
  standalone: true,
  imports: [AsyncPipe, MovieCardComponent],
  templateUrl: './recommendations.page.html',
  styleUrl: './recommendations.page.scss'
})
export class RecommendationsPage {
  protected readonly movieId = signal<number>(0);
  protected readonly page = signal(1);
  protected readonly lang = signal<'pt-PT' | 'en-US'>('pt-PT');
  protected readonly favoriteIds = signal<number[]>([]);

  /** Recomendação favorita do utilizador para esta lista (filme de origem). */
  protected readonly recommendationPickId = signal<number | null>(null);

  protected readonly vm$ = computed(() => {
    const movieId = this.movieId();
    if (!movieId) return null;
    return this.movies.recommendations({ movieId, page: this.page(), lang: this.lang() });
  });

  constructor(
    route: ActivatedRoute,
    private readonly movies: MovieService,
    protected readonly auth: AuthService,
    private readonly dialog: MatDialog
  ) {
    const id = Number(route.snapshot.paramMap.get('id') ?? 0);
    const safeId = Number.isFinite(id) ? id : 0;
    this.movieId.set(safeId);
    if (safeId > 0) {
      this.refreshRecommendationPick(safeId);
    }
    if (this.auth.isLoggedIn()) {
      this.loadFavorites();
    }
  }

  private refreshRecommendationPick(sourceId: number): void {
    this.movies.recommendationPick({ sourceMovieId: sourceId }).subscribe((res) => {
      if (res.error) {
        this.recommendationPickId.set(null);
        return;
      }
      this.recommendationPickId.set(res.picked_tmdb_movie_id ?? null);
    });
  }

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
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

  onRecommendationFavoriteToggle(movie: TmdbMovie): void {
    const src = this.movieId();
    if (!src) return;

    const current = this.recommendationPickId();
    if (current === movie.id) {
      this.movies.clearRecommendationPick({ sourceMovieId: src }).subscribe((res) => {
        if (!res.error) {
          this.recommendationPickId.set(null);
        }
      });
      return;
    }

    this.movies
      .setRecommendationPick({ sourceMovieId: src, pickedTmdbMovieId: movie.id })
      .subscribe((res) => {
        if (!res.error) {
          this.recommendationPickId.set(movie.id);
        }
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
}

