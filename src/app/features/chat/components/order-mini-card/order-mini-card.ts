// Author: Htet Nandar (Grace)
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderSummary } from '../../models/chat.model';

/** Read-only order card for "track my order" style chat replies - no actions, just a
 * date/status/total summary, unlike product-mini-card which is interactive (add to cart). */
@Component({
  selector: 'app-order-mini-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-mini-card.html',
  styleUrl: './order-mini-card.css'
})
export class OrderMiniCard {
  @Input({ required: true }) order!: OrderSummary;

  get statusLabel(): string {
    if (!this.order.status) return '';
    return this.order.status.charAt(0) + this.order.status.slice(1).toLowerCase();
  }
}
