// Author: Htet Nandar (Grace)
import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductSummary } from '../../models/chat.model';
import { CartService } from '../../../../services/cart';

/**
 * add-to-cart action. "+ Add" quick-adds the first/default variant with no size
 * choice - the photo and name link to the full product page for that (see
 * product-mini-card.html), since there's no room for a size picker on a card this small.
 */
@Component({
  selector: 'app-product-mini-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-mini-card.html',
  styleUrl: './product-mini-card.css'
})
export class ProductMiniCard {
  @Input({ required: true }) product!: ProductSummary;

  /** Reactively derived from CartService.items - drives "+ Add" vs. the quantity stepper. */
  quantity = computed(() => {
    const variantId = this.product.defaultVariantId;
    return variantId == null ? 0 : this.cartService.quantityFor(variantId);
  });
  private cartItemId = computed(() => {
    const variantId = this.product.defaultVariantId;
    return variantId == null ? null : this.cartService.cartItemIdFor(variantId);
  });

  // public so the template can read cartService state directly if needed.
  constructor(public cartService: CartService) {}

  addToCart(): void {
    const variantId = this.product.defaultVariantId;
    if (variantId == null) return;
    this.cartService.addToCart(variantId).subscribe();
  }

  increment(): void {
    const id = this.cartItemId();
    if (id == null) {
      this.addToCart();
      return;
    }
    this.cartService.updateQuantity(id, this.quantity() + 1).subscribe();
  }

  decrement(): void {
    const id = this.cartItemId();
    if (id == null) {
      return;
    }
    this.cartService.updateQuantity(id, this.quantity() - 1).subscribe();
  }
}
