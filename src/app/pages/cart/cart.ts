import { Component, inject, OnInit, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItemsResponse } from '../../models/cart-items-response';

@Component({
  selector: 'app-cart',
  imports: [UpperCasePipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

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

  goToHomepage() {
    this.router.navigate([`/`]);
  }
}