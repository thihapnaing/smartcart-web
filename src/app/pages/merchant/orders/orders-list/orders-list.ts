import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MerchantOrderService } from '../../../../services/merchant-order-service';
import { MerchantOrderItemResponse } from '../../../../models/merchant-order-item-response';

// Displays a filterable, read-only table of the merchant's sold order items.
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

  // Labels for the filter tabs shown at the top of the page.
  statusTabs: string[] = ['All', 'Pending', 'Paid', 'Packed', 'Delivered', 'Cancelled'];

  // Tracks which tab is currently selected. Starts on "All".
  selectedStatus: string = 'All';

  constructor(private readonly merchantOrderService: MerchantOrderService) {}

  ngOnInit(): void {
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
  // "All" returns everything, without touching the backend again.
  get filteredOrders(): MerchantOrderItemResponse[] {
    if (this.selectedStatus === 'All') {
      return this.orders;
    }
    return this.orders.filter(
      order => order.orderStatus.toLowerCase() === this.selectedStatus.toLowerCase()
    );
  }
}