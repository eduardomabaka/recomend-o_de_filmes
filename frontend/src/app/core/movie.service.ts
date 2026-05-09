import { Injectable } from '@angular/core';
import { ApiClient } from './api.client';
import type { TmdbMovie, TmdbPagedResponse, TmdbMovieDetails, TmdbWatchProvidersResponse } from './api.types';

@Injectable({ providedIn: 'root' })
export class MovieService {
  constructor(private readonly api: ApiClient) {}

  popular(params?: { lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/popular', params);
  }

  search(params: { q: string; lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/search', params);
  }

  recommendations(params: { movieId: number; lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/recommendations', params);
  }

  details(params: { movieId: number; lang?: string }) {
    return this.api.get<TmdbMovieDetails>('/api/movies/details', params);
  }

  watchProviders(params: { movieId: number }) {
    return this.api.get<TmdbWatchProvidersResponse>('/api/movies/watch-providers', params);
  }
}

