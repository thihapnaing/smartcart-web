export interface AdminProductSummary {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  shopName: string;
  gender: 'MEN' | 'WOMEN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
