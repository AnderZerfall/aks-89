import { z } from "zod";

const UspacyIdSchema = z.union([
  z.string().min(1),
  z.number().int().positive(),
]);

export const UspacySnsEnvelopeSchema = z.discriminatedUnion("Type", [
  z.object({
    Type: z.literal("SubscriptionConfirmation"),
    MessageId: z.string().min(1),
    TopicArn: z.string().min(1),
    Message: z.string(),
    SubscribeURL: z.url(),
    Timestamp: z.string(),
    Token: z.string().min(1),
    SignatureVersion: z.string().optional(),
    Signature: z.string().optional(),
    SigningCertURL: z.string().optional(),
  }),
  z.object({
    Type: z.literal("Notification"),
    MessageId: z.string().min(1),
    TopicArn: z.string().min(1),
    Message: z.string(),
    Timestamp: z.string(),
    SignatureVersion: z.enum(["1", "2"]),
    Signature: z.string().min(1),
    SigningCertURL: z.url(),
    Subject: z.string().optional(),
    UnsubscribeURL: z.string().optional(),
    MessageAttributes: z
      .record(
        z.string(),
        z.object({
          Type: z.string(),
          Value: z.string(),
        }),
      )
      .optional(),
  }),
  z.object({
    Type: z.literal("UnsubscribeConfirmation"),
    MessageId: z.string().min(1),
    TopicArn: z.string().min(1),
    Message: z.string(),
    SubscribeURL: z.url(),
    Timestamp: z.date(),
    Token: z.string().min(1),
    SignatureVersion: z.string().optional(),
    Signature: z.string().optional(),
    SigningCertURL: z.string().optional(),
  }),
]);

export const UspacyDealStageNotificationSchema = z.object({
  topic: z.literal("Notifications"),
  type: z.literal("entity_crm"),
  env: z.string(),
  data: z.object({
    entity: z.object({
      id: UspacyIdSchema,
      table_name: z.literal("deals"),
      kanban_status: z.string(),
      new_kanban_stage_id: UspacyIdSchema.nullable(),
      old_kanban_stage_id: UspacyIdSchema.nullable().optional(),
    }),
    service: z.literal("crm"),
    domain: z.string(),
    action: z.enum(["create", "update", "delete", "update_stage"]),
  }),
});

export const UspacyDealResponseSchema = z.object({
  entity: z
    .object({
      id: UspacyIdSchema,
      kanbanStatus: z.string(),
      kanbanStageId: UspacyIdSchema,
      tableName: z.literal("deals"),
    })
    .loose(),
}).loose();

export const UspacyDealProductsResponseSchema = z.object({
  listProducts: z.array(
    z.object({
      product: z.object({
        id: UspacyIdSchema,
        article: z.string(),
      }).loose(),
    }).loose(),
  ),
}).loose();

export type UspacySnsEnvelope = z.infer<typeof UspacySnsEnvelopeSchema>;
export type UspacyDealStageNotification = z.infer<
  typeof UspacyDealStageNotificationSchema
>;
export type UspacyDealResponse = z.infer<typeof UspacyDealResponseSchema>;
export type UspacyDealProductsResponse = z.infer<
  typeof UspacyDealProductsResponseSchema
>;
