import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItemDetail } from '../../models/cart-item-detail';
import { CartItemsResponse } from '../../models/cart-items-response';

@Component({
  selector: 'app-cart',
  imports: [UpperCasePipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private readonly router = inject(Router);
  // public so the template reads items()/itemCount() straight from the shared service -
  // this way any update made anywhere (chat widget stepper, this page's own stepper,
  // product-detail's add-to-cart) shows up here too, instead of only whatever this
  // page happened to fetch into its own local state when it first loaded.
  readonly cartService = inject(CartService);

  cart = signal<CartItemsResponse | null>(null);

  cartTotal = computed(() =>
    this.cartService.items().reduce((sum, item) => sum + item.subtotal, 0)
  );

  ngOnInit(): void {
    // Guarantees fresh data if /cart is opened directly (e.g. pasted URL) before
    // any other component has triggered CartService's constructor-time refresh().
    this.cartService.refresh();
  }

  increment(item: CartItemDetail): void {
    this.cartService.updateQuantity(item.cartItemId, item.quantity + 1).subscribe();
  }

  decrement(item: CartItemDetail): void {
    this.cartService.updateQuantity(item.cartItemId, item.quantity - 1).subscribe();
  }

  checkout() {
    this.router.navigate([`/checkout`]);
  }

  goToHomepage() {
    this.router.navigate([`/`]);
  }

  changeQuantity(item: CartItemDetail, delta: number) {

  const newQuantity = item.quantity + delta;

  this.cartService
    .updateQuantity(item.cartItemId, newQuantity)
    .subscribe({
      next: (updatedCart) => {
        this.cart.set(updatedCart);
      },
      error: (err) => {
        console.error(err);
      }
    });

}
}
