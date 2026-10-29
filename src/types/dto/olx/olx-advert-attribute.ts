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

export type OlxAdvertAttribute = z.infer<typeof OlxAdvertAttributeSchema>;
export type OlxAdvertCategory = z.infer<typeof OlxAdvertCategorySchema>;
