import { z } from "zod";
import { OlxMessageSchema } from "../../constants/olx.js";

export const OlxAttachmentsSchema = z
  .object({
    name: z.string(),
    url: z.string(),
  })
  .loose();

export const OlxMessageResponseSchema = z.array(
  z
    .object({
      uuid: z.string(),
      threadUuid: z.string(),
      createdAt: z.string(),
      type: OlxMessageSchema,
      text: z.string(),
      attachments: z.array(OlxAttachmentsSchema).nullable(),
      isRead: z.boolean(),
      csv: z.array(OlxAttachmentsSchema).nullable(),
    })
    .loose(),
);

export type OlxAttachments = z.infer<typeof OlxAttachmentsSchema>;
export type OlxMessageResponseDto = z.infer<typeof OlxMessageResponseSchema>;
