import { Gender } from "./gender";
import { ProductStatus } from "./product-status";
import { VariantRequest } from "./variant-request";

export interface ProductRequest {
    name: string;
    description: string;
    price: number;
    gender: Gender;
    categoryId: number;
    status: ProductStatus;
    imageUrl: string;
    color: string;
    variants: VariantRequest[];
}