import { z } from "zod";

export const OlxPriceSchema = z
  .object({
    value: z.number(),
    currency: z.string(),
    negotiable: z.boolean(),
    trade: z.boolean(),
    budget: z.boolean(),
  })
  .loose();

export const OlxPriceResponseSchema = OlxPriceSchema.extend({
  value: z.string(),
});

export type OlxPriceDto = z.infer<typeof OlxPriceSchema>;
export type OlxPriceResponseDto = z.infer<typeof OlxPriceResponseSchema>;
