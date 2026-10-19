export type UspacyProductAvailability =
  | "available"
  | "not_available"
  | "pending";
export type UspacyProductType = "goods" | "service";

export type UspacyPriceDto = {
  price_type_id: number;
  value: number;
  currency: string;
};

export type Product = {
  product_category_id: number;
  measurement_unit_id: number;
  title: string;
  article: string;
  type: UspacyProductType;
  is_active: boolean;
  availability: UspacyProductAvailability;
  quantity: number;
  reserved_quantity: number;
  description: string;
  comment?: string;
  link?: string;
  prices: UspacyPriceDto[];
  files?: string[];
};

export type ListProductParams = {
  page: number;
  list: number;
};

export type CreateProductRequest = {};

export type UpdateProductRequest = {};

export type CreateProductsBulkRequest = {
  products: CreateProductRequest[];
};
