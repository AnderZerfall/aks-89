import { z } from "zod";

export const OlxContactSchema = z
  .object({
    name: z.string().trim().min(1),
    phone: z.string().optional(),
  })
  .loose();

export type OlxContactDto = z.infer<typeof OlxContactSchema>;
