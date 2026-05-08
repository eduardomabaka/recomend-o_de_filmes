import { Routes } from '@angular/router';
import { PopularPage } from './pages/popular/popular.page';
import { SearchPage } from './pages/search/search.page';
import { RecommendationsPage } from './pages/recommendations/recommendations.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { FavoritesPage } from './pages/favorites/favorites.page';

export const routes: Routes = [
  {
    path: '',
    component: PopularPage
  },
  {
    path: 'search',
    component: SearchPage
  },
  {
    path: 'movie/:id/recommendations',
    component: RecommendationsPage
  },
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  },
  {
    path: 'favorites',
    component: FavoritesPage
  },
  { path: '**', redirectTo: '' }
];
