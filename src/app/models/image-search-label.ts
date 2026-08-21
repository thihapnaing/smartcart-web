/** What the backend returns after the CNN classifies an uploaded photo.
 *  searchText is the human-friendly label shown in the search bar, e.g.
 *  "Red Shirt" - it's what actually gets searched against the product
 *  database (see ProductService.searchProducts). gender/color/category
 *  are the raw CNN fields, kept in case a future filter needs them. */
export interface ImageSearchLabel {
  searchText: string;
  gender: string | null;
  color: string | null;
  category: string | null;
}
