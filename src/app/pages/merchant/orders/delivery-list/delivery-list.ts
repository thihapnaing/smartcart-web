import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { environment } from "../../../../../environments/environment";

interface DeliveryPerson {
  id: number;
  name: string;
}

interface DeliveryOrder {
  id: number;
  firstName: string | null;
  lastName: string | null;
  status: string;
  trackingNo: string | null;
  deliveryPersonId: number | null;
  deliveryPersonName: string | null;
  deliveredAt: string | null;
  deliveryProofKey: string | null;
  saving?: boolean;
}

interface ViewUrlResponse {
  viewUrl: string;
}

@Component({
  selector: "app-delivery-list",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./delivery-list.html",
  styleUrl: "./delivery-list.css",
})
export class DeliveryList implements OnInit {
  private readonly ordersUrl = `${environment.apiUrl}/orders/orders`;
  private readonly deliveryPersonelUrl = `${environment.apiUrl}/orders/delivery-men`;
  private readonly proofViewApi = environment.proofViewApi;

  readonly statuses: string[] = [
    "PAID",
    "PACKED",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ];

  orders: DeliveryOrder[] = [];
  deliveryPersonel: DeliveryPerson[] = [];

  loading = false;
  errorMessage = "";
  successMessage = "";

  selectedStatus = "";

  constructor(
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadDeliveryPersonel();
  }

  isDelivered(order: DeliveryOrder): boolean {
    return order.status?.toUpperCase() === "DELIVERED";
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = "";

    this.http
      .get<DeliveryOrder[]>(this.ordersUrl, {
        headers: {
          Accept: "application/json",
        },
      })
      .subscribe({
        next: (orders) => {
          this.orders = [...orders].sort((a, b) =>
            (b.status ?? "").localeCompare(a.status ?? ""),
          );
          this.loading = false;

          // Force Angular to refresh the HTML
          this.changeDetector.detectChanges();
        },
        error: (error) => {
          console.error("Unable to load delivery orders", error);

          this.orders = [];
          this.loading = false;
          this.errorMessage = `Unable to load delivery records (${error.status}).`;

          this.changeDetector.detectChanges();
        },
      });
  }

  loadDeliveryPersonel(): void {
    this.http
      .get<DeliveryPerson[]>(this.deliveryPersonelUrl, {
        headers: {
          Accept: "application/json",
        },
      })
      .subscribe({
        next: (people) => {
          this.deliveryPersonel = people;
          this.changeDetector.detectChanges();
        },
        error: (error) => {
          console.error("Unable to load delivery people", error);
        },
      });
  }

  get filteredOrders(): DeliveryOrder[] {
    if (!this.selectedStatus) {
      return this.orders;
    }

    return this.orders.filter((order) => order.status === this.selectedStatus);
  }

  viewProof(order: DeliveryOrder): void {
    if (!order.deliveryProofKey) {
      this.errorMessage = "No delivery proof available.";
      return;
    }

    const photoWindow = window.open("", "_blank");

    this.http
      .post<ViewUrlResponse>(this.proofViewApi, {
        fileKey: order.deliveryProofKey,
      })
      .subscribe({
        next: (response) => {
          if (response.viewUrl) {
            if (photoWindow) {
              photoWindow.location.href = response.viewUrl;
            } else {
              window.open(response.viewUrl, "_blank", "noopener,noreferrer");
            }
          } else {
            photoWindow?.close();
            this.errorMessage = "No photo URL was returned.";
          }

          this.changeDetector.detectChanges();
        },
        error: (error) => {
          photoWindow?.close();

          console.error("Unable to obtain view URL", error);

          this.errorMessage = "Unable to view delivery proof.";

          this.changeDetector.detectChanges();
        },
      });
  }

  saveDelivery(order: DeliveryOrder): void {
    if (this.isDelivered(order)) {
      return;
    }

    order.saving = true;
    this.errorMessage = "";
    this.successMessage = "";

    const request = {
      status: order.status,
      trackingNo: order.trackingNo?.trim() || null,
      deliveryPersonId: order.deliveryPersonId,
    };

    this.http
      .patch<DeliveryOrder>(`${environment.apiUrl}/api/orders/${order.id}/delivery-details`, request)
      .subscribe({
        next: (updatedOrder) => {
          Object.assign(order, updatedOrder);

          order.saving = false;
          this.successMessage = `Order ${order.id} updated successfully.`;

          this.changeDetector.detectChanges();
        },
        error: (error) => {
          console.error("Unable to update delivery details", error);

          order.saving = false;

          if (error.status === 409) {
            this.errorMessage = "The tracking number is already in use.";
          } else {
            this.errorMessage = `Unable to update order ${order.id}.`;
          }

          this.changeDetector.detectChanges();
        },
      });
  }

  formatStatus(status: string): string {
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}
