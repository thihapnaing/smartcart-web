// Author: Htet Nandar (Grace)
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItemDetail } from '../models/cart-item-detail';
import { CartItemsResponse } from '../models/cart-items-response';
import { AddToCartRequest } from '../models/add-to-cart-request';
import { UpdateCartItemRequest } from '../models/update-cart-item-request';

/**
 * Talks to Spring Boot's /api/cart. Backs the "+ Add" button and quantity
 * stepper on ProductMiniCard (shared by the chat widget and AI Picks page),
 * the nav bar's cart icon badge, and the standalone Cart/Checkout pages.
 *
 * userId is hardcoded server-side (2L) until JWT auth lands - see CartController.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/cart`;

  itemCount = signal<number>(0);
  /** Full line-item list - lets ProductMiniCard look up its own quantity/cartItemId reactively. */
  items = signal<CartItemDetail[]>([]);

  constructor() {
    this.refresh();
  }

  /**
   * Fetches the current cart from the backend. Used directly by the Cart/Checkout pages,
   * and internally by refresh() to keep the nav badge / ProductMiniCard signals in sync.
   */
  getCart(): Observable<CartItemsResponse> {
    return this.http.get<CartItemsResponse>(this.apiBase).pipe(
      tap((res) => this.applyResponse(res))
    );
  }

  /** Pulls the current cart from the backend and updates the signals - e.g. on app start. */
  refresh(): void {
    this.getCart().subscribe({
      error: () => {} // leave state as-is if the backend isn't reachable yet
    });
  }

  /** Current quantity of a product variant in the cart, or 0 if it isn't in there. */
  quantityFor(productVariantId: number): number {
    return this.items().find((i) => i.productVariantId === productVariantId)?.quantity ?? 0;
  }

  /** cart_item row id for a product variant, or null if it isn't in the cart yet. */
  cartItemIdFor(productVariantId: number): number | null {
    return this.items().find((i) => i.productVariantId === productVariantId)?.cartItemId ?? null;
  }

  addToCart(productVariantId: number, quantity = 1) {
    const request: AddToCartRequest = { productVariantId, quantity };
    return this.http.post<CartItemsResponse>(`${this.apiBase}/items`, request).pipe(
      tap((res) => this.applyResponse(res))
    );
  }

  /** Sets a line item to an exact quantity - backs the stepper's +/- buttons. Quantity <= 0 removes it. */
  updateQuantity(cartItemId: number, quantity: number) {
    const request: UpdateCartItemRequest = { quantity };
    return this.http.patch<CartItemsResponse>(`${this.apiBase}/items/${cartItemId}`, request).pipe(
      tap((res) => this.applyResponse(res))
    );
  }

  private applyResponse(res: CartItemsResponse): void {
    this.items.set(res.cartItemDetails);
    this.itemCount.set(res.cartItemDetails.reduce((sum, item) => sum + item.quantity, 0));
  }
}
