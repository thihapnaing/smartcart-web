import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order';
import { CheckoutResponse } from '../../models/checkout-response';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink],
  templateUrl: './order-confirmation.html',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  order = signal<CheckoutResponse | null>(null);

  ngOnInit():void {
    const orderId = Number(this.route.snapshot.params['orderId']);
    this.orderService.getOrderDetail(orderId).subscribe({
      next: (response) => {
        this.order.set(response);
      },
      error: (err) => {
        console.error('Order cannot be retrieved', err);
      }
    })
  }

  getPaymentMethodLabel(method: string): string {
    switch(method) {
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'PAY_NOW':
        return 'PayNow';
      default:
        return method;
    }
  }
}
