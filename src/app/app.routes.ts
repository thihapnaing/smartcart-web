import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/guards/admin-auth-guard';
import { AdminLayout } from './layout/admin-layout/admin-layout';

export const routes: Routes = [
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
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail').then((m) => m.ProductDetail),
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
      },
      {
        path: 'order-confirmation/:orderId',
        loadComponent: () =>
          import('./pages/order-confirmation/order-confirmation').then(
            (m) => m.OrderConfirmationComponent,
          ),
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
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/merchant/orders/orders-list/orders-list').then((m) => m.OrdersList),
      },
      {
        path: 'delivery',
        loadComponent: () =>
          import('./pages/merchant/orders/delivery-list/delivery-list').then(
            (m) => m.DeliveryList,
          ),
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
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./admin/pages/admin-products/admin-products').then((m) => m.AdminProducts),
      },
    ],
  },
];
