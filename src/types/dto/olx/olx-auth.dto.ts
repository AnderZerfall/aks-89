import { z } from "zod";

export const OlxAuthRequestSchema = z.object({
  grantType: z.literal("refresh_token"),
  clientId: z.string(),
  clientSecret: z.string(),
  refreshToken: z.string(),
});

export const OlxAuthResponseSchema = z.object({
  accessToken: z.string(),
});

export type OlxAuthRequestDto = z.infer<typeof OlxAuthRequestSchema>;
export type OlxAuthResponseDto = z.infer<typeof OlxAuthResponseSchema>;
