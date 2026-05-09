import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { API_BASE_URL, getApiBaseCandidates } from './api.config';
import type { ApiResult } from './api.types';
import { Observable, catchError, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly preferredBaseUrlStorageKey = 'api_base_url_preference';

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
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.preferredBaseUrlStorageKey, baseUrl);
  }

  private canRetryWithNextBase(error: unknown, currentIndex: number, total: number): boolean {
    return (
      error instanceof HttpErrorResponse &&
      currentIndex < total - 1 &&
      (error.status === 0 || (error.status >= 200 && error.status < 300))
    );
  }

  private requestWithFallback<T>(
    method: 'get' | 'post' | 'delete',
    path: string,
    options: { params?: HttpParams; body?: unknown }
  ): Observable<ApiResult<T>> {
    const baseUrls = this.getBaseUrlCandidates();

    const attempt = (index: number): Observable<ApiResult<T>> => {
      const baseUrl = baseUrls[index];
      const url = `${baseUrl}${path}`;

      const request$ =
        method === 'get'
          ? this.http.get<ApiResult<T>>(url, { params: options.params })
          : method === 'post'
            ? this.http.post<ApiResult<T>>(url, options.body ?? {})
            : this.http.delete<ApiResult<T>>(url, { params: options.params });

      return request$.pipe(
        switchMap((result) => {
          this.rememberWorkingBaseUrl(baseUrl);
          return of(result);
        }),
        catchError((error) => {
          if (this.canRetryWithNextBase(error, index, baseUrls.length)) {
            return attempt(index + 1);
          }
          return this.mapHttpError<T>(error);
        })
      );
    };

    return attempt(0);
  }

  private mapHttpError<T>(error: unknown): Observable<ApiResult<T>> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return of({
          error: 'Erro de conexão com a API. Verifique se o backend está ligado.'
        } as ApiResult<T>);
      }

      const backendMessage =
        typeof error.error === 'object' && error.error !== null
          ? (error.error as { error?: unknown }).error
          : undefined;
      const isLikelyJsonParseError =
        typeof error.error === 'object' &&
        error.error !== null &&
        'name' in error.error &&
        (error.error as { name?: unknown }).name === 'SyntaxError';

      if ((isLikelyJsonParseError || !backendMessage) && error.status >= 200 && error.status < 300) {
        return of({
          error: 'Resposta inválida da API. Verifique se a URL da API está correta.'
        } as ApiResult<T>);
      }

      const message =
        typeof backendMessage === 'string' && backendMessage.trim() !== ''
          ? backendMessage
          : `Erro da API (${error.status}).`;

      return of({ error: message } as ApiResult<T>);
    }

    return of({ error: 'Ocorreu um erro inesperado ao contactar a API.' } as ApiResult<T>);
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        params = params.set(k, String(v));
      }
    }
    return this.requestWithFallback<T>('get', path, { params });
  }

  post<T>(path: string, body?: unknown) {
    return this.requestWithFallback<T>('post', path, { body });
  }

  delete<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        params = params.set(k, String(v));
      }
    }
    return this.requestWithFallback<T>('delete', path, { params });
  }
}
