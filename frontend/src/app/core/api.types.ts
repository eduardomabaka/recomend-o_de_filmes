export type ApiResult<T> = T & { error?: string };

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
  vote_count?: number;
  genre_ids?: number[];
};

export type TmdbMovieDetails = TmdbMovie & {
  genres?: { id: number; name: string }[];
  tagline?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
};

export type TmdbWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  /** Algumas respostas TMDB podem incluir URL por fornecedor. */
  link?: string | null;
};

export type TmdbWatchProviderCountry = {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
};

export type TmdbWatchProvidersResponse = {
  id: number;
  results?: Record<string, TmdbWatchProviderCountry>;
  error?: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  favorite_genre_id?: number | null;
  worst_genre_id?: number | null;
  quiz_answer_2?: string | null;
  quiz_answer_3?: string | null;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

export type QuizPayload = {
  favorite_genre_id: number;
  worst_genre_id: number;
  quiz_answer_2: string;
  quiz_answer_3: string;
};

