import { z } from "zod";

export const OlxContactSchema = z
  .object({
    name: z.string(),
    phone: z.string(),
  })
  .loose();

export type OlxContactDto = z.infer<typeof OlxContactSchema>;
