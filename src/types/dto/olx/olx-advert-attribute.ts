import { z } from "zod";

export const OlxAdvertAttributeSchema = z
  .object({
    code: z.string(),
    value: z.string().nullable().optional(),
    values: z.array(z.string()).nullable().optional(),
  })
  .loose();

export const OlxAdvertCategorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    photosLimit: z.string(),
  })
  .loose();

export const OlxCategoryAttributeValueSchema = z
  .object({
    code: z.string(),
    label: z.string().optional(),
  })
  .loose();

export const OlxCategoryAttributeValidationSchema = z
  .object({
    required: z.boolean().optional(),
    numeric: z.boolean().optional(),
    type: z.string().optional(),
  })
  .loose();

export const OlxCategoryAttributeSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    unit: z.string().nullable().optional(),
    validation: OlxCategoryAttributeValidationSchema.optional(),
    values: z.array(OlxCategoryAttributeValueSchema).nullable().optional(),
  })
  .loose();

export const OlxCategoryAttributesResponseSchema = z.object({
  data: z.array(OlxCategoryAttributeSchema),
});

export type OlxAdvertAttribute = z.infer<typeof OlxAdvertAttributeSchema>;
export type OlxAdvertCategory = z.infer<typeof OlxAdvertCategorySchema>;
export type OlxCategoryAttribute = z.infer<typeof OlxCategoryAttributeSchema>;
export type OlxCategoryAttributesResponse = z.infer<
  typeof OlxCategoryAttributesResponseSchema
>;
