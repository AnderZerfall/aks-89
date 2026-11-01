import { z } from "zod";
import {
  CrmSyncLocationKey,
  LocationCommentKey,
  Placeholder,
} from "../types/constants/product.js";

export const LocationDataSchema = z.object({
  city: z.string().nullable(),
  region: z.string().nullable(),
  district: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
});

export type LocationData = z.infer<typeof LocationDataSchema>;

function normalizeLocationLabel(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLocaleLowerCase("uk");
}

function extractCoordinates(
  value: string,
): { latitude: string; longitude: string } | null {
  const trimmed = value.trim();
  if (trimmed.includes(";")) {
    const [lat, lon] = trimmed.split(";");
    if (lat && lon) {
      const latClean = lat.trim().replace(",", ".");
      const lonClean = lon.trim().replace(",", ".");
      if (!Number.isNaN(Number(latClean)) && !Number.isNaN(Number(lonClean))) {
        return { latitude: latClean, longitude: lonClean };
      }
    }
  }

  const commaSpaceMatch = trimmed.match(
    /^([+-]?\d+(?:[.,]\d+)?),\s+([+-]?\d+(?:[.,]\d+)?)$/,
  );
  if (commaSpaceMatch) {
    const lat = commaSpaceMatch[1]!.replace(",", ".");
    const lon = commaSpaceMatch[2]!.replace(",", ".");
    if (!Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
      return { latitude: lat, longitude: lon };
    }
  }

  const commaMatch = trimmed.match(/^([+-]?\d+\.\d+),([+-]?\d+\.\d+)$/);
  if (commaMatch) {
    return {
      latitude: commaMatch[1]!,
      longitude: commaMatch[2]!,
    };
  }

  const spaceMatch = trimmed.match(
    /^([+-]?\d+(?:[.,]\d+)?)\s+([+-]?\d+(?:[.,]\d+)?)$/,
  );
  if (spaceMatch) {
    const lat = spaceMatch[1]!.replace(",", ".");
    const lon = spaceMatch[2]!.replace(",", ".");
    if (!Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

export const LocationUtil = {
  buildLocationComment: (loc: LocationData): string => {
    return [
      `${LocationCommentKey.city}: ${loc.city || Placeholder.NotFound}`,
      `${LocationCommentKey.region}: ${loc.region || Placeholder.NotFound}`,
      `${LocationCommentKey.district}: ${loc.district || Placeholder.NotFound}`,
      `${LocationCommentKey.latitude}: ${loc.latitude ?? Placeholder.NotFound}`,
      `${LocationCommentKey.longitude}: ${loc.longitude ?? Placeholder.NotFound}`,
    ].join(" | ");
  },

  parseLocationFromDescription: (
    description?: string,
  ): LocationData | null => {
    if (!description) return null;

    const values = new Map<string, string>();
    const plainText = description
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
      .replace(/<[^>]*>/g, "");

    for (const part of plainText.split(/[\r\n|]+/)) {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) continue;

      const key = normalizeLocationLabel(part.slice(0, separatorIndex));
      const value = part.slice(separatorIndex + 1).trim();
      if (key && value) values.set(key, value);
    }

    const extract = (labels: string[]): string | null => {
      for (const label of labels) {
        const val = values.get(normalizeLocationLabel(label));
        if (val && val !== Placeholder.NotFound) return val;
      }
      return null;
    };

    let latitude: string | null = null;
    let longitude: string | null = null;

    const coordsVal = extract([
      CrmSyncLocationKey.coordinates,
      "coordinates",
    ]);
    if (coordsVal) {
      const parsed = extractCoordinates(coordsVal);
      if (parsed) {
        latitude = parsed.latitude;
        longitude = parsed.longitude;
      }
    }

    if (!latitude || !longitude) {
      const latVal = extract([
        CrmSyncLocationKey.latitude,
        LocationCommentKey.latitude,
        "latitude",
      ]);
      const lonVal = extract([
        CrmSyncLocationKey.longitude,
        LocationCommentKey.longitude,
        "longitude",
      ]);
      if (latVal && lonVal) {
        const latClean = latVal.replace(",", ".");
        const lonClean = lonVal.replace(",", ".");
        if (
          !Number.isNaN(Number(latClean)) &&
          !Number.isNaN(Number(lonClean))
        ) {
          latitude = latClean;
          longitude = lonClean;
        }
      }
    }

    if (!latitude || !longitude) {
      const coordsMatch =
        /(?:координати|coordinates)[\s:]+([+-]?\d+(?:[.,]\d+)?)[,\s;]+([+-]?\d+(?:[.,]\d+)?)/i.exec(
          plainText,
        );
      if (coordsMatch) {
        const latClean = coordsMatch[1]!.replace(",", ".");
        const lonClean = coordsMatch[2]!.replace(",", ".");
        if (
          !Number.isNaN(Number(latClean)) &&
          !Number.isNaN(Number(lonClean))
        ) {
          latitude = latClean;
          longitude = lonClean;
        }
      }
    }

    const city = extract([
      CrmSyncLocationKey.city,
      LocationCommentKey.city,
      "city",
    ]);
    const region = extract([
      CrmSyncLocationKey.region,
      LocationCommentKey.region,
      "region",
    ]);
    const district = extract([
      CrmSyncLocationKey.district,
      LocationCommentKey.district,
      "district",
    ]);

    const street = extract([CrmSyncLocationKey.street, "street"]);
    const building = extract([CrmSyncLocationKey.building, "building"]);
    let address = extract([LocationCommentKey.address, "address"]);
    if (!address && street) {
      address = building ? `${street}, ${building}` : street;
    }

    if (!city && !region && !district && !address && !latitude && !longitude) {
      return null;
    }

    return {
      city,
      region,
      district,
      address,
      latitude,
      longitude,
    };
  },

  parseLocationFromComment: (comment?: string): LocationData | null => {
    return LocationUtil.parseLocationFromDescription(comment);
  },

  createLocationSignature: (loc: {
    city?: string | null;
    address?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }): string | null => {
    const city = (loc.city || "").trim().toLowerCase();
    const address = (loc.address || "").trim().toLowerCase();

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

export const CommentBuilder = LocationUtil;
