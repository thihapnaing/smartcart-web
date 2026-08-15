import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/guards/admin-auth-guard';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { authGuard } from './security/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login').then((m) => m.Login),
  },

  {
    path: 'signup',
    loadComponent: () => import('./pages/auth/signup').then((m) => m.Signup),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/customer-layout/customer-layout').then((m) => m.CustomerLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search-results/search-results').then((m) => m.SearchResults),
        canActivate: [authGuard],
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail').then((m) => m.ProductDetail),
        canActivate: [authGuard],
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart').then((m) => m.CartComponent),
        canActivate: [authGuard],
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
        canActivate: [authGuard],
      },
      {
        path: 'order-confirmation/:orderId',
        loadComponent: () =>
          import('./pages/order-confirmation/order-confirmation').then(
            (m) => m.OrderConfirmationComponent,
          ),
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'merchant',
    loadComponent: () =>
      import('./layout/merchant-layout/merchant-layout').then((m) => m.MerchantLayout),
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/merchant/products/products-list/products-list').then(
            (m) => m.ProductsList,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/merchant/orders/orders-list/orders-list').then((m) => m.OrdersList),
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/pages/admin-login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
        canActivate: [authGuard],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./admin/pages/admin-products/admin-products').then((m) => m.AdminProducts),
        canActivate: [authGuard],
      },
    ],
  },
];
