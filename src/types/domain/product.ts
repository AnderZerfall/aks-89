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
    z
      .number()
      .finite()
      .refine((timestamp) => {
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
      Math.abs(updatedAt) < 1_000_000_000_000 ? updatedAt * 1000 : updatedAt;
    return new Date(milliseconds).toISOString();
  });

const ProductFileSchema = z
  .union([z.string(), z.object({ url: z.string() }).loose()])
  .transform((file) => (typeof file === "string" ? file : file.url));

const ProductFileIdSchema = z
  .union([z.string().trim().min(1), z.number().int().positive()])
  .transform(String);

function normalizeProductFileIds(fileIds: unknown): unknown {
  if (fileIds == null) return undefined;
  return Array.isArray(fileIds)
    ? fileIds.flatMap((fileId) =>
        Array.isArray(fileId) ? normalizeProductFileIds(fileId) : [fileId],
      )
    : [fileIds];
}

const ProductFileIdsSchema = z.preprocess(
  normalizeProductFileIds,
  z.array(ProductFileIdSchema).optional(),
);
const ProductAdditionalSchema = z
  .object({
    foto: ProductFileIdsSchema,
  })
  .loose();
const ProductAdditionalCollectionSchema = z.union([
  z.array(ProductAdditionalSchema),
  ProductAdditionalSchema,
]);

export const ProductSchema = z
  .object({
    id: ProductIdSchema,
    productCategoryId: ProductCategorySchema,
    measurementUnitId: ProductMeasurementSchema,
    title: z.string(),
    article: z.string(),
    updatedAt: ProductUpdatedAtSchema.optional(),
    type: ProductTypeSchema,
    isActive: z
      .union([z.boolean(), z.literal(0), z.literal(1)])
      .transform((isActive) => isActive === true || isActive === 1)
      .nullable()
      .optional(),
    availability: ProductAvailabilitySchema,
    quantity: z
      .number()
      .nullable()
      .transform((quantity) => quantity ?? 0),
    reservedQuantity: z
      .number()
      .nullable()
      .transform((quantity) => quantity ?? 0),
    description: z.string(),
    comment: z.string().nullable().optional(),
    link: z
      .string()
      .nullable()
      .optional()
      .transform((link) => link ?? undefined),
    prices: z.array(PriceSchema),
    previewImageId: ProductFileIdSchema.nullable().optional(),
    files: z.array(ProductFileSchema).optional(),
    foto: ProductFileIdsSchema,
    additional: ProductAdditionalCollectionSchema.nullable().optional(),
  })
  .loose();

export const CreateProductRequestSchema = ProductSchema.omit({
  id: true,
  isActive: true,
});
export const UpdateProductRequestSchema = ProductSchema;
export const UpdateProductImagesRequestSchema = z.object({
  isActive: z.boolean(),
  previewImageId: ProductFileIdSchema,
  additional: z
    .object({
      foto: z.array(ProductFileIdSchema),
    })
    .loose(),
});
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
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type UpdateProductImagesRequest = z.infer<
  typeof UpdateProductImagesRequestSchema
>;
export type CreateProductsBulkRequest = z.infer<
  typeof CreateProductsBulkRequestSchema
>;
export type ListProductsResponse = z.infer<typeof ListProductsResponseSchema>;
