import { LocationCommentKey, Placeholder } from "../types/constants/product.js";

type LocationData = {
  city: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
};

export const CommentBuilder = {
  buildLocationComment: (loc: LocationData): string => {
    return [
      `${LocationCommentKey.City}: ${loc.city || Placeholder.NotFound}`,
      `${LocationCommentKey.Region}: ${loc.region || Placeholder.NotFound}`,
      `${LocationCommentKey.District}: ${loc.district || Placeholder.NotFound}`,
      `${LocationCommentKey.Latitude}: ${loc.latitude ?? Placeholder.NotFound}`,
      `${LocationCommentKey.Longitude}: ${loc.longitude ?? Placeholder.NotFound}`,
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
      city: extract(LocationCommentKey.City),
      region: extract(LocationCommentKey.Region),
      district: extract(LocationCommentKey.District),
      address: extract(LocationCommentKey.Address),
      latitude: extract(LocationCommentKey.Latitude),
      longitude: extract(LocationCommentKey.Longitude),
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
