import { Gender } from './gender';

export interface ProductVariantSearchResult {
  id: number;
  size: string;
  stock: number;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  shopName: string;
  categoryName: string;
  gender: Gender;
  color: string;
  /** First variant's id - lets a quick "+ Add" action skip size selection for a single default variant. */
  defaultVariantId: number | null; // Author: Htet Nandar (Grace)
  variants: ProductVariantSearchResult[];
}
