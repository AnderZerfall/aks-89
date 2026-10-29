import { z } from "zod";
import {
  ProductAvailabilitySchema,
  ProductCategorySchema,
  ProductMeasurementSchema,
  ProductTypeSchema,
} from "../constants/product.js";

export const PriceSchema = z.object({
  priceTypeId: z.number(),
  price: z.number(),
  currency: z.string(),
});

const ProductIdSchema = z
  .union([z.string(), z.number().int().safe()])
  .transform(String);

const ProductUpdatedAtSchema = z
  .union([
    z.string(),
    z.number().finite().refine((timestamp) => {
      const milliseconds =
        Math.abs(timestamp) < 1_000_000_000_000
          ? timestamp * 1000
          : timestamp;
      return Math.abs(milliseconds) <= 8_640_000_000_000_000;
    }),
  ])
  .transform((updatedAt) => {
    if (typeof updatedAt === "string") return updatedAt;

    const milliseconds =
      Math.abs(updatedAt) < 1_000_000_000_000
        ? updatedAt * 1000
        : updatedAt;
    return new Date(milliseconds).toISOString();
  });

export const ProductSchema = z
  .object({
    id: ProductIdSchema,
    productCategoryId: ProductCategorySchema,
    measurementUnitId: ProductMeasurementSchema,
    title: z.string(),
    article: z.string(),
    updatedAt: ProductUpdatedAtSchema.optional(),
    type: ProductTypeSchema,
    isActive: z.boolean(),
    availability: ProductAvailabilitySchema,
    quantity: z.number(),
    reservedQuantity: z.number(),
    description: z.string(),
    comment: z.string().optional(),
    link: z.string().optional(),
    prices: z.array(PriceSchema),
    files: z.array(z.string()).optional(),
  })
  .loose();

export const CreateProductRequestSchema = ProductSchema.omit({ id: true });
export const UpdateProductRequestSchema = ProductSchema;
export const CreateProductsBulkRequestSchema = z.object({
  products: z.array(CreateProductRequestSchema),
});
export const ListProductsResponseSchema = z.object({
  data: z.array(ProductSchema),
});
export const ListProductParamsSchema = z.object({
  page: z.number(),
  list: z.number(),
});

export type Price = z.infer<typeof PriceSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ListProductParams = z.infer<typeof ListProductParamsSchema>;
export type CreateProductRequest = z.infer<
  typeof CreateProductRequestSchema
>;
export type UpdateProductRequest = z.infer<
  typeof UpdateProductRequestSchema
>;
export type CreateProductsBulkRequest = z.infer<
  typeof CreateProductsBulkRequestSchema
>;
export type ListProductsResponse = z.infer<typeof ListProductsResponseSchema>;
