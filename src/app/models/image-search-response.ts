import { ProductSearchResult } from './product-search-result';

//Author: Junior

export interface ImageSearchResponse {
  prediction: string;
  searchLabel: string;
  gender: string;
  color: string;
  category: string;
  products: ProductSearchResult[];
}
