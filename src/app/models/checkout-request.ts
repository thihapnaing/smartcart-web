import { PaymentMethod } from "./payment-method";
export interface CheckoutRequest {
    firstName: string;
    lastName: string;
    shippingAddress: string;
    phoneNumber: string;
    paymentMethod: PaymentMethod;
}
