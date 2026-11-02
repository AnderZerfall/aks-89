import { z } from "zod";

const UspacyEntityIdSchema = z.union([
  z.string().trim().min(1),
  z.number().int().positive(),
]);

const OlxContactPhoneSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  value: z.string().trim().min(1),
  code: z.string().optional(),
});

const OlxContactEmailSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  value: z.email(),
  main: z.boolean(),
});

const OlxContactMessengerSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  link: z.url(),
});

export const olxContactPayloadSchema = z.object({
  title: z.string().trim().min(1),
  source: z.literal("OLX"),
  comments: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  patronymic: z.string().trim().min(1).optional(),
  phone: z.array(OlxContactPhoneSchema).optional(),
  email: z.array(OlxContactEmailSchema).optional(),
  messengers: z.array(OlxContactMessengerSchema).optional(),
  contactLabel: z
    .enum(["Active customer", "Potential client", "Unknown"])
    .optional(),
});

export const OlxContactRequestSchema = olxContactPayloadSchema;

export const UspacyContactSchema = z.object({
  id: UspacyEntityIdSchema,
  title: z.string().min(1),
  owner: z.number().int().positive().optional(),
  phone: z.union([z.array(OlxContactPhoneSchema), z.string()]).optional(),
  email: z.union([z.array(OlxContactEmailSchema), z.string()]).optional(),
});

export const UspacyContactsResponseSchema = z.object({
  data: z.array(UspacyContactSchema),
});

export const OlxLeadPayloadSchema = z.object({
  title: z.string().trim().min(1),
  owner: z.number().int().positive(),
  funnelId: z.number().int().positive(),
  source: z.literal("olx"),
  messengers: z.array(OlxContactMessengerSchema),
  phone: z.array(OlxContactPhoneSchema),
  email: z.array(OlxContactEmailSchema),
  leadLabel: z.array(z.literal("warm_lead")),
  contacts: z.array(z.number().int().positive()).min(1),
  kanbanStageId: z.number().int().positive(),
});

export const OlxLeadRequestSchema = OlxLeadPayloadSchema;

export const UspacyLeadSchema = z.object({
  id: UspacyEntityIdSchema,
  title: z.string().min(1),
});

export const UspacyLeadResponseSchema = UspacyLeadSchema;

export type OlxContactPayload = z.infer<typeof olxContactPayloadSchema>;
export type UspacyContact = z.infer<typeof UspacyContactSchema>;
export type OlxLeadPayload = z.infer<typeof OlxLeadPayloadSchema>;
