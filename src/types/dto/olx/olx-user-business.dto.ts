import { z } from "zod";

export const OlxUserBusinessSchema = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    name: z.string().trim().min(1),
    description: z.string().optional(),
    subdomain: z.string().optional(),
    websiteUrl: z.string().optional(),
    phones: z.array(z.string()).optional(),
    phone: z.string().optional(),
    address: z.record(z.string(), z.unknown()).optional(),
    logo: z.record(z.string(), z.unknown()).optional(),
    banner: z.record(z.string(), z.unknown()).optional(),
  })
  .loose();

export const OlxUserBusinessResponseSchema = z.union([
  OlxUserBusinessSchema,
  z.object({ data: OlxUserBusinessSchema }),
]);

export type OlxUserBusiness = z.infer<typeof OlxUserBusinessSchema>;
export type OlxUserBusinessResponse = z.infer<
  typeof OlxUserBusinessResponseSchema
>;

