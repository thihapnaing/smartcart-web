export interface CartItemDetail {
    cartItemId: number;
    productVariantId: number; // Author: Htet Nandar (Grace)
    productName: string;
    imageUrl: string;
    size: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    gender: string;
    categoryName: string;
    shopName: string;
}
