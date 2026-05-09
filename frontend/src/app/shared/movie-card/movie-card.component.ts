import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { TmdbMovie } from '../../core/api.types';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.scss'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: TmdbMovie;
  @Input() favorite = false;
  @Input() showFavoriteButton = false;
  @Input() recommendationRootMovieId: number | null = null;
  @Input() recommendationPickMovieId: number | null = null;

  @Output() movieClick = new EventEmitter<TmdbMovie>();
  @Output() favoriteToggle = new EventEmitter<TmdbMovie>();
  @Output() recommendationFavoriteToggle = new EventEmitter<TmdbMovie>();

  posterUrl() {
    const p = this.movie.poster_path;
    if (!p) return null;
    return `https://image.tmdb.org/t/p/w342${p}`;
  }

  onClick(): void {
    this.movieClick.emit(this.movie);
  }

  protected showFavoriteIcon(): boolean {
    return this.showFavoriteButton;
  }

  protected favoriteHeartActive(): boolean {
    return this.favorite;
  }

  protected onFavoriteHeart(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.favoriteToggle.emit(this.movie);
  }

  protected showRecommendationFavorite(): boolean {
    return typeof this.recommendationRootMovieId === 'number' && this.recommendationRootMovieId > 0;
  }

  protected recommendationHeartActive(): boolean {
    return this.movie.id === this.recommendationPickMovieId;
  }

  protected onRecommendationHeart(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.recommendationFavoriteToggle.emit(this.movie);
  }
}

