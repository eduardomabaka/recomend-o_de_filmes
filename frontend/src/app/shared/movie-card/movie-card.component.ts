import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TmdbMovie } from '../../core/api.types';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.scss'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: TmdbMovie;

  posterUrl() {
    const p = this.movie.poster_path;
    if (!p) return null;
    return `https://image.tmdb.org/t/p/w342${p}`;
  }
}

