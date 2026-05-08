export type ApiResult<T> = T;

export type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
  error?: string;
};

export type TmdbMovie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

