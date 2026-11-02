import { z } from "zod";

export const OlxThreadRequestSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

const OlxThreadSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.string().uuid(),
  advertId: z.number().int().positive(),
  interlocutorId: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  isFavourite: z.boolean(),
});

const OlxThreadListSchema = z.array(OlxThreadSchema);

export const OlxThreadResponseSchema = z.union([
  OlxThreadListSchema,
  z
    .object({ data: OlxThreadListSchema })
    .transform(({ data }) => data),
]);

export type OlxThreadRequestDto = z.infer<typeof OlxThreadRequestSchema>;
export type OlxThreadResponseDto = z.infer<typeof OlxThreadResponseSchema>;
