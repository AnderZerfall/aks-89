import { z } from "zod";

export const OlxAdvertStatusSchema = z.enum([
  "new",
  "active",
  "limited",
  "removed_by_user",
]);
export const OlxAdvertiserSchema = z.enum(["private", "business"]);
export const OlxMessageSchema = z.enum(["sent", "received"]);

export const OlxAdvertStatus = {
  New: OlxAdvertStatusSchema.enum.new,
  Active: OlxAdvertStatusSchema.enum.active,
  Limited: OlxAdvertStatusSchema.enum.limited,
  RemovedByUser: OlxAdvertStatusSchema.enum.removed_by_user,
} as const;
export const OlxAdvertiser = {
  Private: OlxAdvertiserSchema.enum.private,
  Business: OlxAdvertiserSchema.enum.business,
} as const;
export const OlxMessage = {
  Sent: OlxMessageSchema.enum.sent,
  Received: OlxMessageSchema.enum.received,
} as const;

export type OlxAdvertStatus = z.infer<typeof OlxAdvertStatusSchema>;
export type OlxAdvertiser = z.infer<typeof OlxAdvertiserSchema>;
export type OlxMessage = z.infer<typeof OlxMessageSchema>;
