import { z } from "zod";

export const OlxThreadRequestSchema = z.object({
  advertId: z.number(),
  interlocutorId: z.number(),
  offset: z.number(),
  limit: z.number(),
});

export const OlxThreadResponseSchema = z.array(
  z
    .object({
      uuid: z.string(),
      advertId: z.number(),
      interlocutorId: z.number(),
      totalCount: z.number(),
      unreadCount: z.number(),
      createdAt: z.string(),
      isFavourite: z.boolean(),
    })
    .loose(),
);

export type OlxThreadRequestDto = z.infer<typeof OlxThreadRequestSchema>;
export type OlxThreadResponseDto = z.infer<typeof OlxThreadResponseSchema>;
