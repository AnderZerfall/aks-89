import { z } from "zod";

export const EntityTypeSchema = z.enum([
  "leads",
  "deals",
  "contacts",
  "companies",
]);

export const EntityType = {
  Leads: EntityTypeSchema.enum.leads,
  Deals: EntityTypeSchema.enum.deals,
  Contacts: EntityTypeSchema.enum.contacts,
  Companies: EntityTypeSchema.enum.companies,
} as const;

export const EntitySchema = z.object({
  title: z.string(),
  TableName: EntityTypeSchema,
  type: EntityTypeSchema,
  sort: z.number(),
});

export const CreateEntityRequestSchema = z.object({});
export const UpdateEntityRequestSchema = z.object({});

export type Entity = z.infer<typeof EntitySchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type CreateEntityRequest = z.infer<typeof CreateEntityRequestSchema>;
export type UpdateEntityRequest = z.infer<typeof UpdateEntityRequestSchema>;
