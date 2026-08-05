import { Routes } from '@angular/router';
import { CartComponent } from './pages/cart/cart';
import { CheckoutComponent } from './pages/checkout/checkout';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation';
// Author: Htet Nandar (Grace)
import { HomePage } from './features/home/components/home-page/home-page';

export const routes: Routes = [
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
    { path: '', component: HomePage }
];
