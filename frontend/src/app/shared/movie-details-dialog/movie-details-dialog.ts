import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MovieService } from '../../core/movie.service';
import type {
  TmdbMovie,
  TmdbMovieDetails,
  TmdbWatchProvider,
  TmdbWatchProviderCountry,
  TmdbWatchProvidersResponse,
} from '../../core/api.types';

export type MovieDetailsDialogInput = {
  movie: TmdbMovie;
  overlayMode?: boolean;
  maxPlatforms?: number;
};

@Component({
  selector: 'app-movie-details-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './movie-details-dialog.html',
  styleUrl: './movie-details-dialog.scss',
})
export class MovieDetailsDialog {
  private readonly dialogRef = inject(MatDialogRef<MovieDetailsDialog>);
  private readonly data = inject<MovieDetailsDialogInput>(MAT_DIALOG_DATA);
  private readonly movies = inject(MovieService);

  protected readonly overlayMode = !!this.data.overlayMode;
  protected readonly maxPlatforms = this.data.maxPlatforms ?? 4;

  protected readonly movie = this.data.movie;
  readonly movieDetails = signal<TmdbMovieDetails | null>(null);
  protected readonly providers$ = this.movies.watchProviders({ movieId: this.movie.id });
  protected readonly watchSections = signal<{ title: string; items: TmdbWatchProvider[] }[]>(
    []
  );
  /** Em modo recomendações: apenas os primeiros N fornecedores distintos. */
  readonly topProviders = signal<TmdbWatchProvider[]>([]);
  readonly providerLink = signal<string | null>(null);

  constructor() {
    this.movies.details({ movieId: this.movie.id }).subscribe((details) => {
      this.movieDetails.set(details);
    });

    this.providers$.subscribe((providers) => {
      const countryProviders = this.pickCountryProviders(providers);
      this.providerLink.set(countryProviders?.link ?? null);
      if (this.overlayMode) {
        this.watchSections.set([]);
        this.topProviders.set(this.flattenProviders(countryProviders, this.maxPlatforms));
      } else {
        this.watchSections.set(this.buildWatchSections(countryProviders));
        this.topProviders.set([]);
      }
    });
  }

  private pickCountryProviders(response: TmdbWatchProvidersResponse): TmdbWatchProviderCountry | null {
    const results = response?.results;
    if (!results) {
      return null;
    }

    const preferredCountries = ['PT', 'BR', 'US'];
    for (const country of preferredCountries) {
      if (results[country]) {
        return results[country];
      }
    }

    const firstAvailable = Object.values(results)[0];
    return firstAvailable ?? null;
  }

  private buildWatchSections(countryProviders: TmdbWatchProviderCountry | null) {
    if (!countryProviders) {
      return [];
    }

    return [
      { title: 'Streaming', items: countryProviders.flatrate ?? [] },
      { title: 'Alugar', items: countryProviders.rent ?? [] },
      { title: 'Comprar', items: countryProviders.buy ?? [] },
    ].filter((section) => section.items.length > 0);
  }

  private flattenProviders(
    countryProviders: TmdbWatchProviderCountry | null,
    max: number
  ): TmdbWatchProvider[] {
    if (!countryProviders || max <= 0) {
      return [];
    }

    const ordered: TmdbWatchProvider[] = [
      ...(countryProviders.flatrate ?? []),
      ...(countryProviders.rent ?? []),
      ...(countryProviders.buy ?? []),
    ];

    const seen = new Set<number>();
    const out: TmdbWatchProvider[] = [];
    for (const p of ordered) {
      if (seen.has(p.provider_id)) continue;
      seen.add(p.provider_id);
      out.push(p);
      if (out.length >= max) break;
    }
    return out;
  }

  getProviderLink(provider: TmdbWatchProvider): string | null {
    const knownLinks: Record<number, string> = {
      8: 'https://www.netflix.com/',
      9: 'https://www.primevideo.com/',
      2: 'https://tv.apple.com/',
      337: 'https://www.disneyplus.com/',
      384: 'https://www.hbomax.com/',
      3: 'https://play.google.com/store/movies',
      119: 'https://www.youtube.com/',
      350: 'https://www.paramountplus.com/',
      619: 'https://www.starplus.com/',
    };

    if (knownLinks[provider.provider_id]) {
      return knownLinks[provider.provider_id];
    }

    const name = provider.provider_name.toLowerCase();
    if (name.includes('netflix')) return 'https://www.netflix.com/';
    if (name.includes('prime')) return 'https://www.primevideo.com/';
    if (name.includes('disney')) return 'https://www.disneyplus.com/';
    if (name.includes('apple')) return 'https://tv.apple.com/';
    if (name.includes('hbo')) return 'https://www.hbomax.com/';
    if (name.includes('youtube')) return 'https://www.youtube.com/';
    if (name.includes('google')) return 'https://play.google.com/store/movies';
    if (name.includes('paramount')) return 'https://www.paramountplus.com/';
    if (name.includes('star+')) return 'https://www.starplus.com/';

    return null;
  }

  close() {
    this.dialogRef.close();
  }
}
