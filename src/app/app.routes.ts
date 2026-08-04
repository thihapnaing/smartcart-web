import { Routes } from '@angular/router';

export const routes: Routes = [
  {
  path: 'search',
  loadComponent: () => import('./pages/search-results/search-results').then(m => m.SearchResults)
  },
  {
    path: 'products/:id',
  loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetail)
}
];