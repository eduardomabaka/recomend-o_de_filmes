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
  protected readonly movieDetails = signal<TmdbMovieDetails | null>(null);
  protected readonly providers$ = this.movies.watchProviders({ movieId: this.movie.id });
  protected readonly watchSections = signal<{ title: string; items: TmdbWatchProvider[] }[]>(
    []
  );
  /** Em modo recomendações: apenas os primeiros N fornecedores distintos. */
  protected readonly topProviders = signal<TmdbWatchProvider[]>([]);
  protected readonly providerLink = signal<string | null>(null);

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

  close() {
    this.dialogRef.close();
  }
}
