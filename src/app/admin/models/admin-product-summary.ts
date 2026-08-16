// AUTHOR: Htet Nandar(Grace)
// lastModifiedByAdminUsername/lastModifiedAt are null until the first admin-driven status
// change (activate/deactivate) - see the backend's Product.lastModifiedByAdmin.
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
  merchantId: number;
  lastModifiedByAdminUsername: string | null;
  lastModifiedAt: string | null;
}
