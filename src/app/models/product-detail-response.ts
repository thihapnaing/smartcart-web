import { ProductVariantDetail } from "./product-variant-detail";
import { Gender } from "./gender";
import { ProductStatus } from "./product-status";
export interface ProductDetailResponse {
    productId: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    gender: Gender;
    categoryName: string;
    shopName: string;
    status: ProductStatus;
    color: string,
    variants: ProductVariantDetail[];
}
