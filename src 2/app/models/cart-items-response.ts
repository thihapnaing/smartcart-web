import { CartItemDetail } from "./cart-item-detail";

export interface CartItemsResponse {
    cartItemDetails: CartItemDetail[];
    cartTotal: number;
}
