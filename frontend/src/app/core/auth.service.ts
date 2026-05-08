import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from './api.config';
import type { AuthUser } from './api.types';

type MeResponse = { user: AuthUser };
type AuthResponse = { user?: AuthUser; error?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, body).pipe(
      map((res) => {
        if (res?.user) {
          this.userSignal.set(res.user);
        }
        return res;
      }),
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  register(body: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, body).pipe(
      map((res) => {
        if (res?.user) {
          this.userSignal.set(res.user);
        }
        return res;
      }),
      catchError((error) => of({ error: this.errorMessage(error) }))
    );
  }

  /** Atualiza o utilizador em memória e devolve se existe sessão válida. */
  checkSession(): Observable<boolean> {
    return this.http.get<MeResponse>(`${API_BASE_URL}/api/auth/me`, { withCredentials: true }).pipe(
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

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const payload = (error as { error?: unknown }).error;
      if (typeof payload === 'object' && payload !== null && 'error' in payload) {
        const message = (payload as { error?: unknown }).error;
        if (typeof message === 'string' && message.trim() !== '') {
          return message;
        }
      }
    }

    return 'Não foi possível contactar a API.';
  }
}
