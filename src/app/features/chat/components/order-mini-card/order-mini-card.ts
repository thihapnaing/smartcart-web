// Author: Htet Nandar (Grace)
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, of } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import { OrderSummary } from '../../models/chat.model';
import { CartService } from '../../../../services/cart';

/** Detailed order card for "track my order" style chat replies - order number, date, item
 * thumbnails, and a "Buy again" action that re-adds every line item to the cart at its
 * original variant/quantity. Unlike product-mini-card there's no size picker involved. */
@Component({
  selector: 'app-order-mini-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-mini-card.html',
  styleUrl: './order-mini-card.css'
})
export class OrderMiniCard {
  @Input({ required: true }) order!: OrderSummary;

  readonly buying = signal(false);

  constructor(private readonly cartService: CartService) {}

  get statusLabel(): string {
    if (!this.order.status) return '';
    return this.order.status.charAt(0) + this.order.status.slice(1).toLowerCase();
  }

  get itemCount(): number {
    return this.order.items?.length ?? 0;
  }

  /** Re-adds every line item (that still has a known variant) to the cart at its original
   * quantity - strictly one at a time (concatMap), not in parallel. Each addToCart response
   * carries the *full* cart snapshot and CartService.applyResponse() replaces local state with
   * whatever snapshot arrives - firing them in parallel let responses race, so whichever
   * request's response landed last (not necessarily the one reflecting every added item) won,
   * and the cart looked like it only had one item until a manual reload re-fetched the real
   * state. Going one at a time means each request already sees the previous item committed, so
   * every response's snapshot is a strict superset of the last - no reload needed.
   * catchError lets one failed item skip past without aborting the rest of the sequence. */
  buyAgain(): void {
    if (this.buying()) return;
    const items = (this.order.items ?? []).filter((item) => item.productVariantId != null);
    if (!items.length) return;

    this.buying.set(true);
    from(items)
      .pipe(
        concatMap((item) =>
          this.cartService
            .addToCart(item.productVariantId!, item.quantity || 1)
            .pipe(catchError(() => of(null))),
        ),
      )
      .subscribe({
        complete: () => this.buying.set(false),
      });
  }
}
