import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MovieService } from '../../core/movie.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';

@Component({
  selector: 'app-popular-page',
  standalone: true,
  imports: [AsyncPipe, MovieCardComponent],
  templateUrl: './popular.page.html',
  styleUrl: './popular.page.scss'
})
export class PopularPage {
  protected readonly page = signal(1);
  protected readonly lang = signal<'pt-PT' | 'en-US'>('pt-PT');

  protected readonly vm$ = computed(() => {
    const page = this.page();
    const lang = this.lang();
    return this.movies.popular({ page, lang });
  });

  constructor(private readonly movies: MovieService) {}

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
  }
}

