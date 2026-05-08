import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { HomePage } from './pages/home/home.page';
import { PopularPage } from './pages/popular/popular.page';
import { SearchPage } from './pages/search/search.page';
import { RecommendationsPage } from './pages/recommendations/recommendations.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { FavoritesPage } from './pages/favorites/favorites.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'popular',
    component: PopularPage
  },
  {
    path: 'search',
    component: SearchPage
  },
  {
    path: 'movie/:id/recommendations',
    component: RecommendationsPage,
    canActivate: [authGuard]
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
    component: FavoritesPage,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
