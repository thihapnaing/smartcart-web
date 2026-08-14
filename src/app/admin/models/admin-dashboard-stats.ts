import { AdminProductSummary } from './admin-product-summary';

export interface CategoryCount {
  categoryName: string;
  count: number;
}

export interface GenderCount {
  gender: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardStats {
  totalRevenue: number;
  activeListings: number;
  inactiveListings: number;
  newListingsThisWeek: number;
  activeMerchants: number;
  categoryBreakdown: CategoryCount[];
  genderSplit: GenderCount[];
  recentListings: AdminProductSummary[];
}
