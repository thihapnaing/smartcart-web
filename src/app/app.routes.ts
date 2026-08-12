import { Routes } from '@angular/router';
import { CartComponent } from './pages/cart/cart';
import { CheckoutComponent } from './pages/checkout/checkout';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation';
import { adminAuthGuard } from './admin/guards/admin-auth-guard';
import { AdminLayout } from './layout/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-results/search-results').then(m => m.SearchResults)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetail)
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  {
    path: 'order-confirmation/:orderId',
    component: OrderConfirmationComponent
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/pages/admin-login/admin-login').then(m => m.AdminLogin),
    data: { hideChat: true, hideNav: true }
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminAuthGuard],
    data: { hideChat: true, isAdminArea: true },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/pages/admin-products/admin-products').then(m => m.AdminProducts)
      }
    ]
  }
];
