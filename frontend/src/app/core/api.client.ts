import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import type { ApiResult } from './api.types';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        params = params.set(k, String(v));
      }
    }
    return this.http.get<ApiResult<T>>(`${API_BASE_URL}${path}`, { params });
  }

  post<T>(path: string, body?: unknown) {
    return this.http.post<ApiResult<T>>(`${API_BASE_URL}${path}`, body ?? {});
  }

  delete<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        params = params.set(k, String(v));
      }
    }
    return this.http.delete<ApiResult<T>>(`${API_BASE_URL}${path}`, { params });
  }
}

