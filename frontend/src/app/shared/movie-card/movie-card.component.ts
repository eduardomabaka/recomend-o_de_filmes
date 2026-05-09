import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { TmdbMovie } from '../../core/api.types';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.scss'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: TmdbMovie;
  @Output() movieClick = new EventEmitter<TmdbMovie>();

  posterUrl() {
    const p = this.movie.poster_path;
    if (!p) return null;
    return `https://image.tmdb.org/t/p/w342${p}`;
  }

  onClick() {
    this.movieClick.emit(this.movie);
  }
}

