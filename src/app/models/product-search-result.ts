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
}
