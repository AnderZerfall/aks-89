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

export type OlxPriceDto = z.infer<typeof OlxPriceSchema>;
