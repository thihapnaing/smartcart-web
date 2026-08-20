import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MerchantOrderService } from '../../../services/merchant-order-service';
import { MerchantProductService } from '../../../services/merchant-product-service';
import { MerchantOrderItemResponse } from '../../../models/merchant-order-item-response';
import { ProductSearchResult } from '../../../models/product-search-result';

// /merchant/dashboard - simple landing page for the merchant area. Reuses the same
// order/product data the Orders and Products tabs already fetch (no new backend endpoint)
// for a handful of at-a-glance numbers.
@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class MerchantDashboard implements OnInit {
  private readonly orderService = inject(MerchantOrderService);
  private readonly productService = inject(MerchantProductService);

  protected readonly orders = signal<MerchantOrderItemResponse[]>([]);
  protected readonly products = signal<ProductSearchResult[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly totalRevenue = computed(() =>
    this.orders()
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.subtotal, 0),
  );

  protected readonly totalOrders = computed(
    () => new Set(this.orders().map((o) => o.orderId)).size,
  );

  protected readonly pendingOrders = computed(
    () => new Set(this.orders().filter((o) => o.orderStatus === 'PAID').map((o) => o.orderId)).size,
  );

  protected readonly activeProducts = computed(
    () => this.products().filter((p) => p.status === 'ACTIVE').length,
  );

  // Latest 5 order items, most recent first.
  protected readonly recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5),
  );

  ngOnInit(): void {
    forkJoin({
      orders: this.orderService.getMerchantOrders(),
      products: this.productService.getMyProducts(),
    }).subscribe({
      next: ({ orders, products }) => {
        this.orders.set(orders);
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}
