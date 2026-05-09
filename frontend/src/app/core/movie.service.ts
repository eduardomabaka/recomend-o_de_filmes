import { Injectable } from '@angular/core';
import { ApiClient } from './api.client';
import type {
  TmdbMovie,
  TmdbPagedResponse,
  TmdbMovieDetails,
  TmdbWatchProvidersResponse,
  TmdbGenre
} from './api.types';

@Injectable({ providedIn: 'root' })
export class MovieService {
  constructor(private readonly api: ApiClient) {}

  genres(params?: { lang?: string }) {
    return this.api.get<{ genres: TmdbGenre[] }>('/api/movies/genres', params);
  }

  recommendationPick(params: { sourceMovieId: number }) {
    return this.api.get<{ picked_tmdb_movie_id: number | null }>('/api/movies/recommendation-pick', params);
  }

  setRecommendationPick(body: { sourceMovieId: number; pickedTmdbMovieId: number }) {
    return this.api.post<{ picked_tmdb_movie_id: number | null }>('/api/movies/recommendation-pick', body);
  }

  clearRecommendationPick(query: { sourceMovieId: number }) {
    return this.api.delete<{ picked_tmdb_movie_id: number | null }>(
      '/api/movies/recommendation-pick',
      query
    );
  }

  popular(params?: { lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/popular', params);
  }

  search(params: { q: string; lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/search', params);
  }

  recommendations(params: { movieId: number; lang?: string; page?: number }) {
    return this.api.get<TmdbPagedResponse<TmdbMovie>>('/api/movies/recommendations', params);
  }

  favorites() {
    return this.api.get<{ favorites: { tmdb_movie_id: number }[] }>('/api/movies/favorites');
  }

  addFavorite(body: { tmdb_movie_id: number }) {
    return this.api.post<{ ok: boolean }>('/api/movies/favorites', body);
  }

  removeFavorite(query: { tmdb_movie_id: number }) {
    return this.api.delete<{ ok?: boolean }>('/api/movies/favorites', query);
  }

  toggleFavorite(body: { tmdb_movie_id: number }) {
    return this.api.post<{ is_favorite: boolean }>('/api/movies/toggle-favorite', body);
  }

  details(params: { movieId: number; lang?: string }) {
    return this.api.get<TmdbMovieDetails>('/api/movies/details', params);
  }

  watchProviders(params: { movieId: number }) {
    return this.api.get<TmdbWatchProvidersResponse>('/api/movies/watch-providers', params);
  }
}

