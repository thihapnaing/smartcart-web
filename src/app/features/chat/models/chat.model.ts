// Author: Htet Nandar (Grace)
import { ProductSearchResult } from '../../../models/product-search-result';

/** Chat/recommendation surfaces reuse ProductSearchResult - same product shape the search endpoint returns. */
export type ProductSummary = ProductSearchResult;

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
