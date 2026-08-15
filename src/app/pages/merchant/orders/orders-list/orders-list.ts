import { Component, OnInit } from '@angular/core';
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

  // Full list of orders as received from the backend, unfiltered.
  orders: MerchantOrderItemResponse[] = [];

  isLoading = true;
  errorMessage: string | null = null;

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

  // Tracks which tab is currently selected. Starts on "All orders".
  selectedStatus: string = 'ALL';

  // Holds the orderId of whichever row currently has a "Mark as Packed"
  // request in flight, so that one row's button can be disabled while waiting.
  updatingOrderId: number | null = null;

  constructor(private readonly merchantOrderService: MerchantOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Fetches the merchant's orders from the backend and stores them.
  // Kept as its own method so it can be reused later if a full reload
  // is ever needed after a status update.
  private loadOrders(): void {
    this.isLoading = true;
    this.merchantOrderService.getMerchantOrders().subscribe({
      next: (data: MerchantOrderItemResponse[]) => {
        this.orders = data;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err?.error?.message ?? 'Could not load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Runs when the merchant clicks a tab button.
  selectStatus(status: string): void {
    this.selectedStatus = status;
  }

  // Returns only the orders matching the selected tab.
  // "ALL" returns everything, without contacting the backend again.
  get filteredOrders(): MerchantOrderItemResponse[] {
    if (this.selectedStatus === 'ALL') {
      return this.orders;
    }
    return this.orders.filter(order => order.orderStatus === this.selectedStatus);
  }

  // The Action column only makes sense while looking at "All orders" or
  // "Paid" — every other tab hides the column entirely, matching the design.
  get showActionColumn(): boolean {
    return this.selectedStatus === 'ALL' || this.selectedStatus === 'PAID';
  }

  // Sends a request to change one order's status to "Packed".
  // On success, the order's status is updated locally so the table and
  // tabs reflect the change immediately, without a full page reload.
  markAsPacked(item: MerchantOrderItemResponse): void {
    this.updatingOrderId = item.orderId;
  
    this.merchantOrderService.updateOrderStatus(item.orderId, 'PACKED').subscribe({
      next: () => {
        item.orderStatus = 'PACKED';
        this.updatingOrderId = null;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err?.error?.message ?? 'Could not update the order. Please try again.';
        this.updatingOrderId = null;
      }
    });
  }
}