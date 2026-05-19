import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { HomePage } from './pages/home/home.page';
import { PopularPage } from './pages/popular/popular.page';
import { SearchPage } from './pages/search/search.page';
import { RecommendationsPage } from './pages/recommendations/recommendations.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { FavoritesPage } from './pages/favorites/favorites.page';
import { ProfilePage } from './pages/profile/profile.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    data: { animation: 'home' }
  },
  {
    path: 'popular',
    component: PopularPage,
    data: { animation: 'popular' }
  },
  {
    path: 'search',
    component: SearchPage,
    data: { animation: 'search' }
  },
  {
    path: 'movie/:id/recommendations',
    component: RecommendationsPage,
    canActivate: [authGuard],
    data: { animation: 'reco' }
  },
  {
    path: 'login',
    component: LoginPage,
    data: { animation: 'login' }
  },
  {
    path: 'register',
    component: RegisterPage,
    data: { animation: 'register' }
  },
  {
    path: 'favorites',
    component: FavoritesPage,
    canActivate: [authGuard],
    data: { animation: 'favorites' }
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard],
    data: { animation: 'profile' }
  },
  { path: '**', redirectTo: '' }
];
