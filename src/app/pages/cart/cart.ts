import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItemsResponse } from '../../models/cart-items-response';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);

  cart = signal<CartItemsResponse | null>(null);

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart.set(response);
      },
      error: (err) => {
        console.error('Failed to load cart', err);
      }
    });
  }

  checkout() {
    this.router.navigate([`/checkout`]);
  }
}