import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../core/movie.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';

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

  protected readonly vm$ = computed(() => {
    const q = this.q.trim();
    if (!q) return null;
    return this.movies.search({ q, page: this.page(), lang: this.lang() });
  });

  constructor(private readonly movies: MovieService) {}

  submit() {
    this.page.set(1);
  }

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
  }
}

