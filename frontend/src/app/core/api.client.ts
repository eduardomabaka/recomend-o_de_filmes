import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import type { ApiResult } from './api.types';
import { Observable, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  constructor(private readonly http: HttpClient) {}

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

      if (isLikelyJsonParseError && error.status >= 200 && error.status < 300) {
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
    return this.http.get<ApiResult<T>>(`${API_BASE_URL}${path}`, { params }).pipe(catchError((error) => this.mapHttpError<T>(error)));
  }

  post<T>(path: string, body?: unknown) {
    return this.http.post<ApiResult<T>>(`${API_BASE_URL}${path}`, body ?? {}).pipe(catchError((error) => this.mapHttpError<T>(error)));
  }

  delete<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        params = params.set(k, String(v));
      }
    }
    return this.http.delete<ApiResult<T>>(`${API_BASE_URL}${path}`, { params }).pipe(catchError((error) => this.mapHttpError<T>(error)));
  }
}

