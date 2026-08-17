export interface MerchantOrderItemResponse {
  orderId: number;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  orderStatus: string;
  orderDate: string; 
  deliveredAt: string | null;
  buyerFirstName: string;
  buyerLastName: string;
}