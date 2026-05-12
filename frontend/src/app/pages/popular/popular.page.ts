import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { MovieService } from '../../core/movie.service';
import type { TmdbMovie } from '../../core/api.types';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { MovieDetailsDialog } from '../../shared/movie-details-dialog/movie-details-dialog';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-popular-page',
  standalone: true,
  imports: [AsyncPipe, MovieCardComponent, RouterLink, MatDialogModule],
  templateUrl: './popular.page.html',
  styleUrl: './popular.page.scss'
})
export class PopularPage {
  protected readonly page = signal(1);
  protected readonly lang = signal<'pt-PT' | 'en-US'>('pt-PT');
  protected readonly favoriteIds = signal<number[]>([]);
  protected readonly showCategories = signal(true);
  protected readonly selectedCategory = signal<string | null>(null);

  protected readonly categories: Category[] = [
    {
      id: 'action',
      name: 'Ação',
      icon: '⚡',
      description: 'Ver filmes de ação'
    },
    {
      id: 'horror',
      name: 'Terror',
      icon: '👻',
      description: 'Ver filmes de terror'
    },
    {
      id: 'comedy',
      name: 'Comédia',
      icon: '😂',
      description: 'Ver filmes de comédia'
    },
    {
      id: 'drama',
      name: 'Drama',
      icon: '🎭',
      description: 'Ver filmes de drama'
    },
    {
      id: 'scifi',
      name: 'Ficção Científica',
      icon: '🚀',
      description: 'Ver filmes de ficção científica'
    }
  ];

  protected readonly vm$ = computed(() => {
    const page = this.page();
    const lang = this.lang();
    const category = this.selectedCategory();
    const request$ = this.movies.popular({ page, lang });

    if (!category) {
      return request$;
    }

    const genreId = this.genreIdForCategory(category);
    return request$.pipe(
      map((payload) => {
        if (!payload || !Array.isArray(payload.results) || !genreId) {
          return payload;
        }

        return {
          ...payload,
          results: payload.results.filter(
            (movie) => Array.isArray(movie.genre_ids) && movie.genre_ids.includes(genreId)
          )
        };
      })
    );
  });

  constructor(
    private readonly movies: MovieService,
    protected readonly auth: AuthService,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) {
    // Mostrar categorias apenas se estiver logado
    this.showCategories.set(this.auth.isLoggedIn());
    
    if (this.auth.isLoggedIn()) {
      this.loadFavorites();
    }
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

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.showCategories.set(false);
  }

  backToCategories(): void {
    this.showCategories.set(true);
    this.selectedCategory.set(null);
    this.page.set(1);
  }

  private genreIdForCategory(categoryId: string): number | null {
    switch (categoryId) {
      case 'action':
        return 28;
      case 'horror':
        return 27;
      case 'comedy':
        return 35;
      case 'drama':
        return 18;
      case 'scifi':
        return 878;
      default:
        return null;
    }
  }

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
  }

  onMovieClick(movie: TmdbMovie) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/register');
      return;
    }

    this.dialog.open(MovieDetailsDialog, {
      data: { movie, overlayMode: true, maxPlatforms: 4 },
      width: 'min(92vw, 640px)',
      maxWidth: '96vw',
      backdropClass: 'dialog-transparent-backdrop',
      panelClass: 'dialog-glass-surface'
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

