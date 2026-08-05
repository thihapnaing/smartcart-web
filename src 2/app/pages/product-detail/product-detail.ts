import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProductById(id).subscribe(data => {
      this.product.set(data);
    });
  }

  selectVariant(variant: ProductVariantDetail): void {
    this.selectedVariant.set(variant);
    this.addedMessage.set('');
  }

  addToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) {
      this.addedMessage.set('Please select a size first.');
      return;
    }
    this.cartService.addToCart({
      productVariantId: variant.productVariantId,
      quantity: this.quantity()
    }).subscribe({
      next: () => this.addedMessage.set('Added to cart!'),
      error: () => this.addedMessage.set('Something went wrong. Please try again.')
    });
  }
}