import { Gender } from "./gender";
export interface ProductSearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  shopName: string;
  categoryName: string;
  gender: Gender;
  /** First variant's id - lets a quick "+ Add" action skip size selection for a single default variant. */
  defaultVariantId: number | null; // Author: Htet Nandar (Grace)
}
