import { ProductVariantDetail } from "./product-variant-detail";
import { Gender } from "./gender";
export interface ProductDetailResponse {
    productId: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    gender: Gender;
    categoryName: string;
    shopName: string;
    variants: ProductVariantDetail[];
}
