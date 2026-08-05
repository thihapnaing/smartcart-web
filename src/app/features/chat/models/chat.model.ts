// Author: Htet Nandar (Grace)

/**
 * Matches Spring Boot's ProductSummaryDto exactly - the trimmed-down product shape chat
 * replies carry. NOT the same shape as ProductSearchResult (used by /products/search and
 * /products/browse): this one has productId (not id) and category (not categoryName), and
 * is missing description/shopName/gender entirely.
 */
export interface ProductSummary {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  /** First variant's id - lets a quick "+ Add" action skip size selection for a single default variant. */
  defaultVariantId: number | null;
}

export interface ChatMessage {
  senderRole: 'user' | 'assistant';
  content: string;
  createdAt: string;
  products?: ProductSummary[];
}

/** Matches Spring Boot's ChatResponse DTO exactly. */
export interface ChatResponse {
  sessionId: string;
  reply: string;
  products?: ProductSummary[];
  suggestions?: string[];
}
