import { Component, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MovieService } from '../../core/movie.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';

@Component({
  selector: 'app-popular-page',
  standalone: true,
  imports: [AsyncPipe, MovieCardComponent, RouterLink],
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

  constructor(
    private readonly movies: MovieService,
    protected readonly auth: AuthService
  ) {}

  next() {
    this.page.update((p) => p + 1);
  }

  prev() {
    this.page.update((p) => Math.max(1, p - 1));
  }
}

