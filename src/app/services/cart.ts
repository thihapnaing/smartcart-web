import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AddToCartRequest } from '../models/add-to-cart-request';
import { CartItemsResponse } from '../models/cart-items-response';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);

  getCart(): Observable<CartItemsResponse> {
    const url = `${environment.apiUrl}/cart`;
    return this.http.get<CartItemsResponse>(url).pipe(
      tap(response => this.updateCountFrom(response))
    );
  }

  addToCart(request: AddToCartRequest): Observable<CartItemsResponse> {
    const url = `${environment.apiUrl}/cart/items`;
    return this.http.post<CartItemsResponse>(url, request).pipe(
      tap(response => this.updateCountFrom(response))
    );
  }

  // Adds up the quantity field across every item in the response and
  // stores the total in the count signal.
  private updateCountFrom(response: CartItemsResponse): void {
    const totalItems = response.cartItemDetails.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    this.itemCount.set(totalItems);
  }
}