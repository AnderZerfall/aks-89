import { z } from "zod";
import { LocationCommentKey, Placeholder } from "../types/constants/product.js";

export const LocationDataSchema = z.object({
  city: z.string().nullable(),
  region: z.string().nullable(),
  district: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
});

export type LocationData = z.infer<typeof LocationDataSchema>;

export const CommentBuilder = {
  buildLocationComment: (loc: LocationData): string => {
    return [
      `${LocationCommentKey.city}: ${loc.city || Placeholder.NotFound}`,
      `${LocationCommentKey.region}: ${loc.region || Placeholder.NotFound}`,
      `${LocationCommentKey.district}: ${loc.district || Placeholder.NotFound}`,
      `${LocationCommentKey.latitude}: ${loc.latitude ?? Placeholder.NotFound}`,
      `${LocationCommentKey.longitude}: ${loc.longitude ?? Placeholder.NotFound}`,
    ].join(" | ");
  },
  parseLocationFromComment: (comment?: string): LocationData | null => {
    if (!comment) return null;

    const extract = (key: LocationCommentKey) => {
      const regex = new RegExp(`${key}:\\s*([^|]+)`, "i");
      const match = regex.exec(comment);

      const val = match?.[1]?.trim();
      if (val === Placeholder.NotFound) return null;

      return val || null;
    };

    return {
      city: extract(LocationCommentKey.city),
      region: extract(LocationCommentKey.region),
      district: extract(LocationCommentKey.district),
      address: extract(LocationCommentKey.address),
      latitude: extract(LocationCommentKey.latitude),
      longitude: extract(LocationCommentKey.longitude),
    };
  },
  createLocationSignature: (loc: {
    city?: string | null;
    address?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }): string | null => {
    const city = (loc.city || "").trim().toLowerCase();
    const address = (loc.address || "").trim().toLowerCase();

    // Format coordinates to 4 decimal places to handle minor floating-point variations safely
    const latNum =
      loc.latitude !== undefined &&
      loc.latitude !== null &&
      loc.latitude !== "Н/Д"
        ? Number(loc.latitude)
        : NaN;
    const lonNum =
      loc.longitude !== undefined &&
      loc.longitude !== null &&
      loc.longitude !== "Н/Д"
        ? Number(loc.longitude)
        : NaN;

    const lat = !isNaN(latNum) ? latNum.toFixed(4) : "";
    const lon = !isNaN(lonNum) ? lonNum.toFixed(4) : "";

    if (!city && !address && !lat && !lon) {
      return null;
    }

    return `${city}|${address}|${lat}|${lon}`;
  },
};
