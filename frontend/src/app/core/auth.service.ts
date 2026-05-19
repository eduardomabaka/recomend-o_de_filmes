import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { API_BASE_URL, getApiBaseCandidates } from './api.config';
import type { AuthUser, QuizPayload } from './api.types';

type MeResponse = { user: AuthUser };
type AuthResponse = { user?: AuthUser; error?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly preferredBaseUrlStorageKey = 'api_base_url_preference';
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  private getBaseUrlCandidates(): string[] {
    if (typeof window === 'undefined') {
      return [API_BASE_URL];
    }

    const saved = window.localStorage.getItem(this.preferredBaseUrlStorageKey);
    const candidates = getApiBaseCandidates();
    if (!saved || !candidates.includes(saved)) {
      return candidates;
    }

    return [saved, ...candidates.filter((url) => url !== saved)];
  }

  private rememberWorkingBaseUrl(baseUrl: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.preferredBaseUrlStorageKey, baseUrl);
    }
  }

  private requestWithFallback<T>(
    path: string,
    method: 'get' | 'post',
    body?: unknown
  ): Observable<T> {
    const baseUrls = this.getBaseUrlCandidates();

    const attempt = (index: number): Observable<T> => {
      const baseUrl = baseUrls[index];
      const url = `${baseUrl}${path}`;
      const request$ =
        method === 'get'
          ? this.http.get<T>(url, { withCredentials: true })
          : this.http.post<T>(url, body ?? {}, { withCredentials: true });

      return request$.pipe(
        switchMap((result) => {
          this.rememberWorkingBaseUrl(baseUrl);
          return of(result);
        }),
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 0 && index < baseUrls.length - 1) {
            return attempt(index + 1);
          }
          throw error;
        })
      );
    };

    return attempt(0);
  }

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.requestWithFallback<AuthResponse>('/api/auth/login', 'post', body).pipe(
      map((res) => {
        if (res?.user) {
          this.userSignal.set(res.user);
        }
        return res;
      }),
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  register(body: {
    name: string;
    email: string;
    password: string;
    quiz: QuizPayload;
  }): Observable<AuthResponse> {
    return this.requestWithFallback<AuthResponse>('/api/auth/register', 'post', body).pipe(
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  updateProfile(body: { name: string; email: string; password?: string }): Observable<AuthResponse> {
    return this.requestWithFallback<AuthResponse>('/api/auth/profile', 'post', body).pipe(
      map((res) => {
        if (res?.user) {
          this.userSignal.set(res.user);
        }
        return res;
      }),
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  logout(): Observable<{ ok?: boolean; error?: string }> {
    return this.requestWithFallback<{ ok?: boolean; error?: string }>('/api/auth/logout', 'post').pipe(
      map((res) => {
        this.userSignal.set(null);
        return res;
      }),
      catchError((error) => {
        this.userSignal.set(null);
        return of({ error: this.errorMessage(error) });
      })
    );
  }

  /** Atualiza o utilizador em memória e devolve se existe sessão válida. */
  checkSession(): Observable<boolean> {
    return this.requestWithFallback<MeResponse>('/api/auth/me', 'get').pipe(
      map((res) => {
        if (res?.user) {
          this.userSignal.set(res.user);
          return true;
        }
        this.userSignal.set(null);
        return false;
      }),
      catchError(() => {
        this.userSignal.set(null);
        return of(false);
      })
    );
  }

  refresh(): void {
    this.checkSession().subscribe();
  }

  clearLocal(): void {
    this.userSignal.set(null);
  }

  requestAccountDeletion(): Observable<{ success?: boolean; message?: string; error?: string }> {
    return this.requestWithFallback<{ success?: boolean; message?: string; error?: string }>(
      '/api/auth/account-delete/request',
      'post'
    ).pipe(catchError((error) => of({ error: this.errorMessage(error) })));
  }

  confirmAccountDeletion(body: { code: string }): Observable<{ success?: boolean; message?: string; error?: string }> {
    return this.requestWithFallback<{ success?: boolean; message?: string; error?: string }>(
      '/api/auth/account-delete/confirm',
      'post',
      body
    ).pipe(
      map((res) => {
        if (res?.success) {
          this.userSignal.set(null);
        }
        return res;
      }),
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Sem ligação ao servidor. Confirme que o Apache está ligado em XAMPP e que pode aceder ao backend.';
      }

      const raw = error.error;
      if (typeof raw === 'object' && raw !== null && 'error' in raw) {
        const msg = (raw as { error?: unknown }).error;
        if (typeof msg === 'string' && msg.trim() !== '') {
          return msg;
        }
      }

      const text = typeof raw === 'string' ? raw.replace(/<[^>]+>/g, ' ').trim() : '';
      if (text.length > 15 && text.length < 320) {
        return text.slice(0, 220);
      }

      return `O servidor devolveu erro ${error.status}.`;
    }

    return 'Ocorreu um erro inesperado ao comunicar com a API.';
  }
}
