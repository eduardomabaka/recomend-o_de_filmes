import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MovieService } from '../../core/movie.service';
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

  protected readonly vm$ = computed(() => {
    const movieId = this.movieId();
    if (!movieId) return null;
    return this.movies.recommendations({ movieId, page: this.page(), lang: this.lang() });
  });

  constructor(
    route: ActivatedRoute,
    private readonly movies: MovieService,
    private readonly dialog: MatDialog
  ) {
    const id = Number(route.snapshot.paramMap.get('id') ?? 0);
    this.movieId.set(Number.isFinite(id) ? id : 0);
  }

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
  }

  onMovieClick(movie: TmdbMovie) {
    this.dialog.open(MovieDetailsDialog, {
      data: { movie },
      width: '80vw',
      maxWidth: '800px'
    });
  }
}

