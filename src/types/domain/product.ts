import type { ProductAvailability, ProductCategory, ProductMeasurement, ProductType } from "../constants/product.js";

export type Price = {
  price_type_id: number;
  price: number;
  currency: string;
};

export type Product = {
  product_category_id: ProductCategory;
  measurement_unit_id: ProductMeasurement;
  title: string;
  article: string;
  type: ProductType;
  is_active: boolean;
  availability: ProductAvailability;
  quantity: number;
  reserved_quantity: number;
  description: string;
  comment?: string;
  link?: string;
  prices: Price[];
  files?: string[];
};

export type ListProductParams = {
  page: number;
  list: number;
};

export type CreateProductRequest = {

};

export type UpdateProductRequest = {
  
};

export type CreateProductsBulkRequest = {
  products: CreateProductRequest[];
};
