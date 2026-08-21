import { CartItemDetail } from "./cart-item-detail"
import { OrderStatus } from "./order-status";
import { DeliveryDetails } from "./delivery-details";
import { PaymentMethod } from "./payment-method";
export interface CheckoutResponse {
    orderId: number;
    cartItemDetails: CartItemDetail[];
    totalAmount: number;
    orderStatus: OrderStatus;
    deliveryDetails: DeliveryDetails;
    paymentMethod: PaymentMethod;
}
