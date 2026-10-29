import { z } from "zod";

export const ProductAvailabilitySchema = z.enum([
  "available",
  "not_available",
  "pending",
]);
export const ProductTypeSchema = z.enum(["goods", "service"]);
export const LocationCommentKeySchema = z.enum([
  "Місто",
  "Регіон",
  "Район",
  "Адреса",
  "Широта",
  "Довгота",
]);
export const PlaceholderSchema = z.literal("інформації не знайдено");

export const ProductCategory = {
  FlatSell: 1,
  CommercialSell: 2,
  HouseSell: 3,
  FlatRent: 4,
  HouseRent: 5,
  CommercialRent: 6,
} as const;
export const ProductCategorySchema = z.enum(ProductCategory);
export const ProductMeasurement = {
  SquareMeters: 7,
} as const;
export const ProductMeasurementSchema = z.enum(ProductMeasurement);

export const ProductAvailability = {
  Available: ProductAvailabilitySchema.enum.available,
  NotAvailable: ProductAvailabilitySchema.enum.not_available,
  Pending: ProductAvailabilitySchema.enum.pending,
} as const;
export const ProductType = {
  Goods: ProductTypeSchema.enum.goods,
  Service: ProductTypeSchema.enum.service,
} as const;
export const LocationCommentKey = {
  city: LocationCommentKeySchema.enum["Місто"],
  region: LocationCommentKeySchema.enum["Регіон"],
  district: LocationCommentKeySchema.enum["Район"],
  address: LocationCommentKeySchema.enum["Адреса"],
  latitude: LocationCommentKeySchema.enum["Широта"],
  longitude: LocationCommentKeySchema.enum["Довгота"],
} as const;
export const Placeholder = {
  NotFound: PlaceholderSchema.value,
} as const;

export type ProductAvailability = z.infer<typeof ProductAvailabilitySchema>;
export type ProductType = z.infer<typeof ProductTypeSchema>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ProductMeasurement = z.infer<typeof ProductMeasurementSchema>;
export type LocationCommentKey = z.infer<typeof LocationCommentKeySchema>;
export type Placeholder = z.infer<typeof PlaceholderSchema>;
