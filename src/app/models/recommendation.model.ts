export interface RecommendedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  reason: string;
  score: number;
}

export interface RecommendationResult {
  agent_summary: string;
  products: RecommendedProduct[];
}
