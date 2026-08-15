import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MerchantOrderItemResponse } from '../models/merchant-order-item-response';

@Injectable({
  providedIn: 'root'
})
export class MerchantOrderService {

  // Base address for order-related backend calls, built the same way product.ts builds its own.
  private readonly apiBase = `${environment.apiUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

  // Requests the list of order items belonging to the current merchant.
  getMerchantOrders(): Observable<MerchantOrderItemResponse[]> {
    return this.http.get<MerchantOrderItemResponse[]>(`${this.apiBase}/merchant`);
  }

// Asks the backend to change one order's status (for example, from "Paid" to "Packed").
// Sends a PATCH request, since this is updating one field on an existing order
// rather than creating something new or replacing the whole order.
updateOrderStatus(orderId: number, newStatus: string): Observable<MerchantOrderItemResponse> {
  return this.http.patch<MerchantOrderItemResponse>(
    `${this.apiBase}/${orderId}/status`,
    { status: newStatus }
  );
}
}