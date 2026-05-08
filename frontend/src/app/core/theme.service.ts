import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'fzone-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('dark');

  init(): void {
    this.setMode(this.getStoredMode());
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private setMode(mode: ThemeMode): void {
    this.mode.set(mode);

    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = mode;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }

  private getStoredMode(): ThemeMode {
    if (typeof localStorage === 'undefined') {
      return 'dark';
    }

    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  }
}
