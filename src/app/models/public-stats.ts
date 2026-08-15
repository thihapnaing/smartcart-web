// Author: Htet Nandar (Grace)
// Mirrors the backend's PublicStatsDto (GET /api/public/stats) - the small, unauthenticated
// subset of AdminDashboardStats shown on the /admin/login screen before sign-in.
export interface PublicStats {
  activeListings: number;
  activeMerchants: number;
  totalRevenue: number;
}
