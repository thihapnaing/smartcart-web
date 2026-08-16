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

  // Defines the order sizes should appear in on screen, smallest first.
  private readonly sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
  ) {}

  // Author: Htet Nandar (Grace)
  // Was reading route.snapshot once, so navigating from one product page straight to
  // another (e.g. /products/2 -> /products/1 via a routerLink) never re-fetched - Angular
  // reuses the same component instance for the same route, it doesn't get destroyed and
  // recreated just because the :id param changed. Subscribing to paramMap instead reacts
  // to every param change, not just the first one.
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.loadProduct(id);
    });
  }

  private loadProduct(id: number): void {
    // Reset per-product state so the previous product's selections don't leak
    // into the new one while the new data is still loading.
    this.product.set(null);
    this.selectedVariant.set(null);
    this.quantity.set(1);
    this.addedMessage.set('');
    this.justAdded.set(false);
    this.priceAlertSet.set(false);

    this.productService.getProductById(id).subscribe((data) => {
      this.product.set(data);

      // Pre-selects the smallest size that still has stock, so the quantity
      // box and stock count are visible as soon as the page opens.
      const firstAvailable = this.sortedVariants().find((variant) => variant.stock > 0);
      if (firstAvailable) {
        this.selectedVariant.set(firstAvailable);
      }
    });
  }

  // Returns the product's sizes arranged smallest to largest.
  // Any size not listed in sizeOrder is placed at the end.
  sortedVariants(): ProductVariantDetail[] {
    const p = this.product();
    if (!p?.variants) {
      return [];
    }

    // The [...] makes a copy of the list first, because sort() rearranges
    // the list it is given, and the original data should stay untouched.
    return [...p.variants].sort((first, second) => {
      const positionOfFirst = this.sizeOrder.indexOf(first.size);
      const positionOfSecond = this.sizeOrder.indexOf(second.size);

      // indexOf returns -1 when a size is not found in sizeOrder.
      // Replacing -1 with a large number pushes unknown sizes to the end.
      const rankOfFirst = positionOfFirst === -1 ? 99 : positionOfFirst;
      const rankOfSecond = positionOfSecond === -1 ? 99 : positionOfSecond;

      return rankOfFirst - rankOfSecond;
    });
  }

  // Reports whether this product has any size rows at all.
  // Used by the template to show a message instead of an empty size row.
  hasVariants(): boolean {
    const p = this.product();
    return !!p && !!p.variants && p.variants.length > 0;
  }

  // Turns the raw gender value ('MEN' / 'WOMEN') into display text ('Men' / 'Women').
  //edited by Shannon
  genderLabel(): string {
    const p = this.product();
    if (!p) return '';

    const gender = String(p.gender ?? '')
      .trim()
      .toUpperCase();

    // Male → Men
    if (gender === 'MEN' || gender === 'MALE') {
      return 'Men';
    }
    // Female → Women
    if (gender === 'WOMEN' || gender === 'FEMALE') {
      return 'Women';
    }
    return '';
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
      error: () => this.addedMessage.set('Something went wrong. Please try again.'),
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
      error: () => this.addedMessage.set('Something went wrong. Please try again.'),
    });
  }

  goBack(): void {
    this.router.navigate(['/search']);
  }
}
