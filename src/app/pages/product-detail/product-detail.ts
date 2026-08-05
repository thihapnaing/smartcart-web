import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { ProductDetailResponse } from '../../models/product-detail-response';
import { ProductVariantDetail } from '../../models/product-variant-detail';

@Component({
  selector: 'app-product-detail',
  imports: [],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  product = signal<ProductDetailResponse | null>(null);
  selectedVariant = signal<ProductVariantDetail | null>(null);
  quantity = signal(1);
  addedMessage = signal('');

  // True for a moment right after a successful add, used to flash
  // the "Added to cart!" state on the button.
  justAdded = signal(false);

  // Tracks whether a price alert is currently turned on for this product.
  priceAlertSet = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cartService: CartService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProductById(id).subscribe(data => {
      this.product.set(data);

      // Pre-selects the first size that still has stock, so the quantity
      // box and stock count are visible as soon as the page opens.
      const firstAvailable = data.variants.find(variant => variant.stock > 0);
      if (firstAvailable) {
        this.selectedVariant.set(firstAvailable);
      }
    });
  }

  // Turns the raw gender value ('MEN' / 'WOMEN') into display text ('Men' / 'Women').
  genderLabel(): string {
    const p = this.product();
    if (!p) return '';
    return p.gender === 'MEN' ? 'Men' : 'Women';
  }

  selectVariant(variant: ProductVariantDetail): void {
    this.selectedVariant.set(variant);
    this.addedMessage.set('');
    // Quantity resets to 1 because each size has its own stock level,
    // and the previous quantity might exceed the new size's stock.
    this.quantity.set(1);
  }

  // The most a shopper can order: the stock of the chosen size.
  // Before a size is chosen there is no stock number yet, so 1 is used.
  maxQuantity(): number {
    return this.selectedVariant()?.stock ?? 1;
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity()) {
      this.quantity.set(this.quantity() + 1);
    }
  }

  // Flips the price alert between on and off each time the button is clicked.
  togglePriceAlert(): void {
    this.priceAlertSet.set(!this.priceAlertSet());
  }

  addToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) {
      this.addedMessage.set('Please select a size first.');
      return;
    }
    this.cartService.addToCart(variant.productVariantId, this.quantity()).subscribe({
      next: () => {
        this.addedMessage.set('');
        this.justAdded.set(true);
        // The flash message reverts to the normal button text after 1.4 seconds.
        setTimeout(() => this.justAdded.set(false), 1400);
      },
      error: () => this.addedMessage.set('Something went wrong. Please try again.')
    });
  }

  // Adds the item to the cart, then goes straight to the checkout page.
  buyNow(): void {
    const variant = this.selectedVariant();
    if (!variant) {
      this.addedMessage.set('Please select a size first.');
      return;
    }
    this.cartService.addToCart(variant.productVariantId, this.quantity()).subscribe({
      next: () => this.router.navigate(['/checkout']),
      error: () => this.addedMessage.set('Something went wrong. Please try again.')
    });
  }

  goBack(): void {
    this.router.navigate(['/search']);
  }
}