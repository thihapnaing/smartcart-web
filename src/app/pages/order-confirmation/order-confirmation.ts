import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CheckoutResponse } from '../../models/checkout-response';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmationComponent implements OnInit {
  protected readonly orders = signal<CheckoutResponse[]>([]);

  ngOnInit(): void {
    const stateOrders = (history.state as { orders?: CheckoutResponse[] })?.orders;

    if (stateOrders) {
      this.orders.set(stateOrders);
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CREDIT_CARD':
        return 'Credit Card';
      case 'PAY_NOW':
        return 'PayNow';
      default:
        return method;
    }
  }
}