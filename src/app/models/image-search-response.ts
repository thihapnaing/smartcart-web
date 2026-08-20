import { ProductSearchResult } from './product-search-result';

export interface ImageSearchResponse {
  prediction: string;

  searchLabel: string;

  gender: string;

  gender_confidence: number;

  category: string;

  category_confidence: number;

  color: string;

  color_confidence: number;

  products: ProductSearchResult[];
}
