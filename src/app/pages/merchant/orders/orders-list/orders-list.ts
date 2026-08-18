import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MerchantOrderService } from '../../../../services/merchant-order-service';
import { MerchantOrderItemResponse } from '../../../../models/merchant-order-item-response';

// One filter tab. "label" is the text shown on the button.
// "value" is compared against an order's actual status, kept separate
// so a two-word label like "Picked up" can still match a one-word
// backend code like "PICKED_UP".
interface StatusTab {
  label: string;
  value: string;
}

// Displays a filterable, read-only table of the merchant's sold order items,
// with an action button on orders that are ready to be marked as packed.
@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.css'
})
export class OrdersList implements OnInit {
  readonly merchantOrderService = inject(MerchantOrderService);
  orders = signal<MerchantOrderItemResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  selectedStatus = signal('ALL');
  updatingOrderId = signal<number | null>(null);

  filteredOrders = computed(() => {
    const status = this.selectedStatus();
    const all = this.orders();
    return status === 'ALL' ? all : all.filter(o => o.orderStatus === status);
  });

  showActionColumn = computed(() => this.selectedStatus() === 'ALL' || this.selectedStatus() === 'PAID');

  // Filter tabs shown at the top of the page. Each "value" matches the
  // backend's OrderStatus enum exactly (all capitals, underscore for
  // multi-word statuses).
  statusTabs: StatusTab[] = [
    { label: 'All orders', value: 'ALL' },
    { label: 'Pending',    value: 'PENDING' },
    { label: 'Paid',       value: 'PAID' },
    { label: 'Packed',     value: 'PACKED' },
    { label: 'Picked up',  value: 'PICKED_UP' },
    { label: 'Delivered',  value: 'DELIVERED' },
    { label: 'Cancelled',  value: 'CANCELLED' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  // Fetches the merchant's orders from the backend and stores them.
  // Kept as its own method so it can be reused later if a full reload
  // is ever needed after a status update.
  private loadOrders(): void {
    this.isLoading.set(true);
    this.merchantOrderService.getMerchantOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load orders. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  // Runs when the merchant clicks a tab button.
  selectStatus(status: string): void {
    this.selectedStatus.set(status);
  }
}