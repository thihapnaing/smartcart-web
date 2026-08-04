import {Injectable, inject} from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { CheckoutRequest } from '../models/checkout-request'
import { CheckoutResponse } from '../models/checkout-response'
import { environment } from '../../environments/environment'

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);

    checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
        const url = `${environment.apiUrl}/orders/checkout`;
        return this.http.post<CheckoutResponse>(url, request);
    }

    getOrderDetail(orderId: number): Observable<CheckoutResponse> {
        const url = `${environment.apiUrl}/orders/${orderId}`
        return this.http.get<CheckoutResponse>(url);
    }
}
