import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovieService } from '../../core/movie.service';
import { AuthService } from '../../core/auth.service';
import type { QuizPayload } from '../../core/api.types';

const FREQUENCY_OPTS = [
  { value: 'menos-3h-semana', label: 'Menos de 3 horas por semana' },
  { value: '3a10h-semana', label: 'Entre 3 e 10 horas por semana' },
  { value: 'mais-10h-semana', label: 'Mais de 10 horas por semana' }
];

const CONTEXT_OPTS = [
  { value: 'casa', label: 'Em casa / streaming' },
  { value: 'cinema', label: 'No cinema, quando há estreias' },
  { value: 'misturado', label: 'Combinado entre casa e cinema' }
];

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage implements OnInit {
  protected readonly FREQUENCY_OPTS = FREQUENCY_OPTS;
  protected readonly CONTEXT_OPTS = CONTEXT_OPTS;

  protected readonly step = signal<1 | 2 | 3 | 4>(1);

  name = '';
  email = '';
  password = '';

  favoriteGenreId = 0;
  worstGenreId = 0;
  quiz_answer_2 = '';
  quiz_answer_3 = '';

  protected readonly genres = signal<{ id: number; name: string }[]>([]);
  readonly error = signal('');
  readonly genresError = signal('');
  readonly loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly movies: MovieService
  ) {}

  /** Nome para o resumo (passo 4). */
  protected genreLabel(id: number): string {
    if (!id) return '—';
    return this.genres().find((g) => g.id === id)?.name ?? `#${id}`;
  }

  protected habitLabel(slug: string): string {
    return FREQUENCY_OPTS.find((o) => o.value === slug)?.label ?? slug;
  }

  protected contextLabel(slug: string): string {
    return CONTEXT_OPTS.find((o) => o.value === slug)?.label ?? slug;
  }

  ngOnInit(): void {
    this.movies.genres({ lang: 'pt-PT' }).subscribe((res) => {
      if (res.error) {
        this.genresError.set(res.error);
        return;
      }
      if (Array.isArray(res.genres)) {
        this.genres.set(res.genres);
      }
    });
  }

  next(): void {
    this.error.set('');
    const s = this.step();
    if (s === 1) {
      if (!this.name.trim() || !this.email.trim() || !this.password) {
        this.error.set('Preencha nome, email e palavra-passe.');
        return;
      }
      this.step.set(2);
      return;
    }

    if (s === 2) {
      if (this.genres().length === 0) {
        this.error.set(
          this.genresError() || 'Não foi possível carregar géneros. Recarregue a página.'
        );
        return;
      }
      if (!this.favoriteGenreId || !this.worstGenreId || this.favoriteGenreId === this.worstGenreId) {
        this.error.set('Escolha dois géneros diferentes (favorito e menos apreciado).');
        return;
      }
      this.step.set(3);
      return;
    }

    if (s === 3) {
      if (!this.quiz_answer_2.trim() || !this.quiz_answer_3.trim()) {
        this.error.set('Responda às duas perguntas.');
        return;
      }
      this.step.set(4);
      return;
    }
  }

  back(): void {
    this.error.set('');
    const s = this.step();
    if (s > 1) {
      this.step.set((s - 1) as 1 | 2 | 3 | 4);
    }
  }

  submit(): void {
    if (this.step() !== 4) return;
    this.error.set('');
    const quiz: QuizPayload = {
      favorite_genre_id: this.favoriteGenreId,
      worst_genre_id: this.worstGenreId,
      quiz_answer_2: this.quiz_answer_2.trim(),
      quiz_answer_3: this.quiz_answer_3.trim()
    };

    this.loading.set(true);
    this.auth
      .register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        quiz
      })
      .subscribe((res) => {
        this.loading.set(false);

        if (res.error || !res.user) {
          this.error.set(res.error ?? 'Não foi possível criar a conta.');
          return;
        }

        this.router.navigateByUrl('/login');
      });
  }
}
