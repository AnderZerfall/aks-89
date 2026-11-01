import {
  CrmSyncLocationKey,
  LocationCommentKey,
  Placeholder,
} from "../types/constants/product.js";
import type { LocationData } from "./location-util.js";

const CRM_SYNC_MARKER =
  /(?:^|[\r\n]|<br\s*\/?>|<\/(?:p|div)\s*>)[\t ]*(?:<p(?:\s[^>]*)?>[\t ]*)?---[\t ]*CRM_SYNC[\t ]*:[\t ]*/im;
const HTML_LINE_BREAKS = /<br\s*\/?>|<\/(?:p|div|li|tr|h\d)>/gi;
const HTML_TAGS = /<[^>]*>/g;
const METADATA_LINE_SEPARATOR = /[\r\n|]+/;
const KEY_NORMALIZATION_PATTERN = /[\s-]+/g;
const HIDDEN_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;
const COORDINATE_PATTERNS = [
  /^([+-]?\d+(?:[.,]\d+)?)\s*;\s*([+-]?\d+(?:[.,]\d+)?)$/,
  /^([+-]?\d+(?:[.,]\d+)?),\s+([+-]?\d+(?:[.,]\d+)?)$/,
  /^([+-]?\d+(?:[.,]\d+)?)\s+([+-]?\d+(?:[.,]\d+)?)$/,
  /^([+-]?\d+\.\d+),([+-]?\d+\.\d+)$/,
  /^([+-]?\d+),([+-]?\d+)$/,
];
const LATITUDE_RANGE = { min: -90, max: 90 };
const LONGITUDE_RANGE = { min: -180, max: 180 };
const GENERIC_LOCATION_KEYS = {
  city: "city",
  region: "region",
  district: "district",
  street: "street",
  building: "building",
  coordinates: "coordinates",
  latitude: "latitude",
  longitude: "longitude",
} as const;
const ADDRESS_SEPARATOR = ", ";

type CrmSyncDescription = {
  publicDescription: string;
  metadata: Map<string, string>;
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(HIDDEN_CHARACTERS, "")
    .trim()
    .toLocaleLowerCase("uk")
    .replace(KEY_NORMALIZATION_PATTERN, "_");
}

function getCoordinates(value: string): [string, string] | null {
  const trimmedValue = value.trim();
  for (const pattern of COORDINATE_PATTERNS) {
    const match = pattern.exec(trimmedValue);
    if (match) return [match[1]!, match[2]!];
  }
  return null;
}

function parseCoordinate(value: string): number | null {
  const normalizedValue = value.trim().replace(",", ".");
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalizedValue)) return null;

  const coordinate = Number(normalizedValue);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function isWithinRange(
  value: number,
  range: { min: number; max: number },
): boolean {
  return value >= range.min && value <= range.max;
}

function parseCoordinatePair(
  latitudeValue: string,
  longitudeValue: string,
): { latitude: string; longitude: string } | null {
  const latitude = parseCoordinate(latitudeValue);
  const longitude = parseCoordinate(longitudeValue);
  if (
    latitude === null ||
    longitude === null ||
    !isWithinRange(latitude, LATITUDE_RANGE) ||
    !isWithinRange(longitude, LONGITUDE_RANGE)
  ) {
    return null;
  }

  return {
    latitude: String(latitude),
    longitude: String(longitude),
  };
}

function parseMetadata(text: string): Map<string, string> {
  const plainText = text.replace(HTML_LINE_BREAKS, "\n").replace(HTML_TAGS, "");
  const metadata = new Map<string, string>();

  for (const line of plainText.split(METADATA_LINE_SEPARATOR)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) continue;

    const key = normalizeKey(line.slice(0, separatorIndex));
    const value = line.slice(separatorIndex + 1).trim();
    if (key && value) metadata.set(key, value);
  }

  return metadata;
}

function getMetadataValue(
  metadata: ReadonlyMap<string, string>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata.get(normalizeKey(key));
    if (value && value !== Placeholder.NotFound) return value;
  }
  return null;
}

function getLocation(
  metadata: ReadonlyMap<string, string>,
): LocationData | null {
  const coordinateText = getMetadataValue(
    metadata,
    CrmSyncLocationKey.coordinates,
    GENERIC_LOCATION_KEYS.coordinates,
  );
  const coordinatePair = coordinateText
    ? getCoordinates(coordinateText)
    : null;
  const latitudeValue =
    getMetadataValue(
      metadata,
      CrmSyncLocationKey.latitude,
      GENERIC_LOCATION_KEYS.latitude,
    ) ?? coordinatePair?.[0];
  const longitudeValue =
    getMetadataValue(
      metadata,
      CrmSyncLocationKey.longitude,
      GENERIC_LOCATION_KEYS.longitude,
    ) ?? coordinatePair?.[1];
  const coordinates =
    latitudeValue && longitudeValue
      ? parseCoordinatePair(latitudeValue, longitudeValue)
      : null;

  const street = getMetadataValue(
    metadata,
    CrmSyncLocationKey.street,
    GENERIC_LOCATION_KEYS.street,
  );
  const building = getMetadataValue(
    metadata,
    CrmSyncLocationKey.building,
    GENERIC_LOCATION_KEYS.building,
  );
  const address =
    getMetadataValue(metadata, LocationCommentKey.address, "address") ??
    ([street, building]
      .filter((part): part is string => Boolean(part))
      .join(ADDRESS_SEPARATOR) ||
      null);

  return {
    city: getMetadataValue(
      metadata,
      CrmSyncLocationKey.city,
      GENERIC_LOCATION_KEYS.city,
    ),
    region: getMetadataValue(
      metadata,
      CrmSyncLocationKey.region,
      GENERIC_LOCATION_KEYS.region,
    ),
    district: getMetadataValue(
      metadata,
      CrmSyncLocationKey.district,
      GENERIC_LOCATION_KEYS.district,
    ),
    address,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
  };
}

export const CrmSyncUtil = {
  parseDescription(description: string): CrmSyncDescription {
    const marker = CRM_SYNC_MARKER.exec(description);
    if (!marker || marker.index === undefined) {
      return { publicDescription: description.trim(), metadata: new Map() };
    }

    const metadataStart = marker.index + marker[0].length;
    const markerStart = marker.index + marker[0].indexOf("---");
    const publicDescription = description
      .slice(0, markerStart)
      .replace(/<p(?:\s[^>]*)?>[\t ]*$/i, "")
      .trim();

    return {
      publicDescription,
      metadata: parseMetadata(description.slice(metadataStart)),
    };
  },

  getLocation,
  normalizeAttributeKey: normalizeKey,
};
