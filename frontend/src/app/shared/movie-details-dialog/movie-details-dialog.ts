import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MovieService } from '../../core/movie.service';
import type { TmdbMovie, TmdbWatchProvider, TmdbWatchProviderCountry, TmdbWatchProvidersResponse } from '../../core/api.types';

@Component({
  selector: 'app-movie-details-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, AsyncPipe, DatePipe, DecimalPipe],
  templateUrl: './movie-details-dialog.html',
  styleUrl: './movie-details-dialog.scss',
})
export class MovieDetailsDialog {
  private readonly dialogRef = inject(MatDialogRef<MovieDetailsDialog>);
  private readonly data = inject<{ movie: TmdbMovie }>(MAT_DIALOG_DATA);
  private readonly movies = inject(MovieService);

  protected readonly movie = this.data.movie;
  protected readonly details$ = this.movies.details({ movieId: this.movie.id });
  protected readonly providers$ = this.movies.watchProviders({ movieId: this.movie.id });
  protected readonly watchSections = signal<
    { title: string; items: TmdbWatchProvider[] }[]
  >([]);
  protected readonly providerLink = signal<string | null>(null);

  constructor() {
    this.providers$.subscribe((providers) => {
      const countryProviders = this.pickCountryProviders(providers);
      this.providerLink.set(countryProviders?.link ?? null);
      this.watchSections.set(this.buildWatchSections(countryProviders));
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

  close() {
    this.dialogRef.close();
  }
}
