import { z } from "zod";

export const OlxLocationSchema = z
  .object({
    cityId: z.number().optional(),
    districtId: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .loose();

export const OlxRegionSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .loose();

export const OlxRegionResponseSchema = z.union([
  OlxRegionSchema,
  z.object({ data: OlxRegionSchema }),
]);

export const OlxCitySchema = z
  .object({
    id: z.number(),
    regionId: z.number(),
    name: z.string(),
    county: z.string(),
    municipality: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .loose();

export const OlxDistrictSchema = z
  .object({
    id: z.number(),
    cityId: z.number(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .loose();

export const OlxLocationResponseSchema = z.object({
  data: z.array(
    z.object({
      city: OlxCitySchema,
      district: OlxDistrictSchema.nullable(),
    }),
  ),
});

export type OlxLocationDto = z.infer<typeof OlxLocationSchema>;
export type OlxRegionDto = z.infer<typeof OlxRegionSchema>;
export type OlxRegionResponseDto = z.infer<typeof OlxRegionResponseSchema>;
export type OlxCityResponseDto = z.infer<typeof OlxCitySchema>;
export type OlxDistrictResponseDto = z.infer<typeof OlxDistrictSchema>;
export type OlxLocationResponseDto = z.infer<typeof OlxLocationResponseSchema>;
