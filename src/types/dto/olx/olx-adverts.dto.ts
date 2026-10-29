import { z } from "zod";
import {
  OlxAdvertiserSchema,
  OlxAdvertStatusSchema,
} from "../../constants/olx.js";
import { OlxAdvertAttributeSchema } from "./olx-advert-attribute.js";
import { OlxContactSchema } from "./olx-contact.dto.js";
import {
  OlxLocationResponseSchema,
  OlxLocationSchema,
} from "./olx-location.dto.js";
import {
  OlxPriceResponseSchema,
  OlxPriceSchema,
} from "./olx-price.dto.js";

export const OlxPhotoSchema = z.object({ url: z.string() }).loose();

export const OlxAdvertSchema = z
  .object({
    id: z.number(),
    status: OlxAdvertStatusSchema,
    url: z.string().optional(),
    createdAt: z.string().optional(),
    activatedAt: z.string().optional(),
    validTo: z.string().optional(),
    title: z.string(),
    description: z.string(),
    categoryId: z.number(),
    advertiserType: OlxAdvertiserSchema.optional(),
    externalId: z.string().nullable().optional(),
    externalUrl: z.string().nullable().optional(),
    contact: OlxContactSchema.optional(),
    location: OlxLocationResponseSchema.optional(),
    attributes: z.array(OlxAdvertAttributeSchema).optional(),
    price: OlxPriceResponseSchema,
    images: z.array(OlxPhotoSchema).optional(),
  })
  .loose();

export const OlxEnrichedAdvertSchema = OlxAdvertSchema.extend({
  enrichedLocation: z.object({
    city: z.string(),
    district: z.string(),
    region: z.string(),
    address: z.string(),
  }),
});

export const OlxAdvertsResponseSchema = z.object({
  data: z.array(OlxAdvertSchema),
});

export const CreateOlxAdvertRequestSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    categoryId: z.number(),
    advertiserType: OlxAdvertiserSchema,
    location: OlxLocationSchema,
    price: OlxPriceSchema,
    images: z.array(OlxPhotoSchema).optional(),
    attributes: z.array(OlxAdvertAttributeSchema).optional(),
    contact: OlxContactSchema.optional(),
    externalId: z.string().nullable().optional(),
    externalUrl: z.string().nullable().optional(),
  })
  .loose();

export const CreateOlxAdvertResponseDataSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    categoryId: z.number(),
    status: OlxAdvertStatusSchema,
    url: z.string(),
    createdAt: z.string(),
    activatedAt: z.string().optional(),
    validTo: z.string().optional(),
    location: OlxLocationResponseSchema,
    price: OlxPriceResponseSchema,
    photos: z.array(OlxPhotoSchema),
    attributes: z.array(OlxAdvertAttributeSchema).optional(),
    externalId: z.string().nullable().optional(),
  })
  .loose();

export const CreateOlxAdvertResponseSchema = z.object({
  data: CreateOlxAdvertResponseDataSchema,
});

export const UpdateOlxAdvertRequestSchema =
  CreateOlxAdvertRequestSchema.partial();
export const UpdateOlxAdvertResponseSchema = CreateOlxAdvertResponseSchema;
export const OlxStatusActionRequestSchema = z.object({
  command: z.enum(["activate", "deactivate"]),
  isSuccess: z.boolean(),
});

export type OlxPhoto = z.infer<typeof OlxPhotoSchema>;
export type OlxAdvert = z.infer<typeof OlxAdvertSchema>;
export type OlxEnrichedAdvert = z.infer<typeof OlxEnrichedAdvertSchema>;
export type OlxAdvertsResponseDto = z.infer<typeof OlxAdvertsResponseSchema>;
export type CreateOlxAdvertRequestDto = z.infer<
  typeof CreateOlxAdvertRequestSchema
>;
export type CreateOlxAdvertResponseData = z.infer<
  typeof CreateOlxAdvertResponseDataSchema
>;
export type CreateOlxAdvertResponseDto = z.infer<
  typeof CreateOlxAdvertResponseSchema
>;
export type UpdateOlxAdvertRequestDto = z.infer<
  typeof UpdateOlxAdvertRequestSchema
>;
export type UpdateOlxAdvertResponseDto = z.infer<
  typeof UpdateOlxAdvertResponseSchema
>;
export type OlxStatusActionRequestDto = z.infer<
  typeof OlxStatusActionRequestSchema
>;
export type DeactivateRequestDto = OlxStatusActionRequestDto;
