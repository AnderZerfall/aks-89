import {
  CrmSyncLocationKey,
  LocationCommentKey,
  Placeholder,
} from "../types/constants/product.js";
import type { OlxAdvertAttribute } from "../types/dto/olx/olx-advert-attribute.js";
import type { LocationData } from "./location-util.js";

const ATTRIBUTES_OPEN_TAG = "[Атрибути]";
const ATTRIBUTES_CLOSE_TAG = "[/Атрибути]";
const CRM_SYNC_MARKER =
  /(?:^|[\r\n]|<br\s*\/?>|<\/(?:p|div)\s*>)[\t ]*(?:<p(?:\s[^>]*)?>[\t ]*)?(?:\[Атрибути\]|---[\t ]*CRM_SYNC[\t ]*:)[\t ]*/im;
const HTML_LINE_BREAKS = /<br\s*\/?>|<\/(?:p|div|li|tr|h\d)>/gi;
const HTML_TAGS = /<[^>]*>/g;
const KEY_NORMALIZATION_PATTERN = /[\s-]+/g;
const HIDDEN_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;
const METADATA_BULLET_PATTERN = /^[ \t]*•[ \t]*/gm;
const METADATA_SECTION_PATTERN = /^[ \t]*(?:ЛОКАЦІЯ|ХАРАКТЕРИСТИКИ)[ \t]*$/gim;
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
const ATTRIBUTE_LABELS = {
  from_developer: "Від забудовника",
  commission: "Комісія",
  is_exchange: "Обмін",
  cooperate: "Співпраця",
  eoselia: "єОселя",
  city_distance: "Відстань до міста",
  total_floors: "Кількість поверхів",
  total_area: "Загальна площа",
  number_of_rooms: "Кількість кімнат",
  land_area: "Площа ділянки",
  property_type_houses: "Тип нерухомості (будинки)",
  house_type: "Тип будинку",
  external_wall_insulation: "Утеплення зовнішніх стін",
  roof_type: "Тип даху",
  bathroom_3: "Санвузол",
  heating: "Опалення",
  repair: "Ремонт",
  furnish: "Меблювання",
  appliances: "Побутова техніка",
  multimedia_2: "Мультимедіа",
  comfort_4: "Комфорт будинку",
  communications: "Комунікації",
  infrastructure_500_m: "Інфраструктура (до 500 м)",
  ecosystem_1_km: "Екосистема (до 1 км)",
  property_type_land: "Тип нерухомості (земля)",
  plot_buildings: "Будівлі на ділянці",
  apartments_object_type: "Тип об'єкта квартири",
  property_type_appartments_sale: "Тип квартири",
  zkh: "Житловий комплекс",
  floor: "Поверх",
  kitchen_area: "Площа кухні",
  apartments_dev_type: "Клас житла",
  number_of_rooms_string: "Кількість кімнат (тип)",
  layout: "Планування",
  bathroom: "Санвузол (квартира)",
  comfort: "Комфорт квартири",
} as const;
const ATTRIBUTE_CODES_BY_LABEL = new Map(
  Object.entries(ATTRIBUTE_LABELS).map(([code, label]) => [
    normalizeKey(label),
    code,
  ]),
);
const ATTRIBUTE_VALUE_LABELS: Record<string, Record<string, string>> = {
  apartments_object_type: {
    primary_market: "Первинний ринок",
    secondary_market: "Вторинний ринок",
  },
  apartments_dev_type: {
    business: "Бізнес-клас",
    economy: "Економ-клас",
  },
  number_of_rooms_string: {
    odnokomnatnye: "Однокімнатна",
    dvuhkomnatnye: "Двокімнатна",
    trehkomnatnye: "Трикімнатна",
    chetyrehkomnatnye: "Чотирикімнатна",
    pyatikomnatnye: "П'ятикімнатна",
  },
  layout: {
    adjacent_through: "Суміжно-прохідне",
    separate: "Роздільне",
  },
  heating: {
    centralized: "Централізоване",
    combined: "Комбіноване",
    individual_electro: "Індивідуальне електричне",
  },
  furnish: {
    yes: "З меблями",
    no: "Без меблів",
  },
  appliances: {
    fridge: "Холодильник",
    hob: "Варильна поверхня",
    oven: "Духова шафа",
    stove: "Плита",
    washer: "Пральна машина",
  },
  multimedia_2: {
    speed_internet: "Швидкісний інтернет",
    tv: "Телебачення",
    wifi: "Wi-Fi",
  },
  comfort: {
    cctv: "Відеоспостереження",
    air_conditioning: "Кондиціонер",
    concierge: "Консьєрж",
    elevator: "Ліфт",
    fire_alarm: "Пожежна сигналізація",
    ground_parking: "Наземний паркінг",
    guest_parking: "Гостьовий паркінг",
    kitchen_furniture: "Меблі на кухні",
    panoramic_windows: "Панорамні вікна",
    protected_area: "Територія під охороною",
    service_lift: "Вантажний ліфт",
    wardrobe: "Гардеробна",
    shower: "Душ",
    signaling: "Сигналізація",
  },
  comfort_4: {
    air_conditioning: "Кондиціонер",
    fence: "Огорожа",
    shower_cabin: "Душова кабіна",
    fireplace: "Камін",
    garden: "Сад",
    huest_house: "Гостьовий будинок",
    guest_house: "Гостьовий дім",
    sauna: "Сауна",
  },
  plot_buildings: {
    fence: "Огорожа",
  },
  communications: {
    asphalt_road: "Асфальтована дорога",
    central_sewerage_system: "Централізована каналізація",
    electricity: "Електрика",
    garbage_removal: "Вивіз сміття",
    gas: "Газ",
    sewerage_septic_tank: "Септик",
    water_central: "Централізоване водопостачання",
    well: "Свердловина",
  },
  infrastructure_500_m: {
    bank_atm: "Банк / банкомат",
    cinema_theater: "Кінотеатр",
    city_center: "Центр міста",
    farmacy: "Аптека",
    market: "Ринок",
    metro: "Метро",
    railway_station: "Залізнична станція",
    restaurant_cafe: "Ресторан / кафе",
    shop_kiosk: "Магазин / кіоск",
    supermarket_mall: "Супермаркет / торговий центр",
    transport_stop: "Зупинка транспорту",
    school: "Школа",
  },
  ecosystem_1_km: {
    forest: "Ліс",
    reservoir: "Водойма",
    river: "Річка",
  },
  property_type_houses: {
    house: "Будинок",
    country_house: "Дачний будинок",
  },
  external_wall_insulation: {
    mineral_wool: "Мінеральна вата",
  },
  roof_type: {
    metal_tile: "Металочерепиця",
    metal_slate: "Металевий шифер",
  },
  from_developer: {
    "0": "Ні",
    "1": "Так",
  },
  commission: {
    "0": "Ні",
    "1": "Так",
  },
  is_exchange: {
    "0": "Ні",
    "1": "Так",
  },
  cooperate: {
    "0": "Ні",
    "1": "Так",
  },
  eoselia: {
    "0": "Ні",
    "1": "Так",
  },
};
const ATTRIBUTE_VALUE_CODES = new Map(
  Object.entries(ATTRIBUTE_VALUE_LABELS).map(([code, values]) => [
    code,
    new Map(
      Object.entries(values).map(([value, label]) => [
        normalizeKey(label),
        value,
      ]),
    ),
  ]),
);
const MULTI_VALUE_ATTRIBUTE_CODES = new Set([
  "appliances",
  "communications",
  "comfort",
  "comfort_4",
  "ecosystem_1_km",
  "infrastructure_500_m",
  "multimedia_2",
  "plot_buildings",
]);
const LOCATION_METADATA_KEYS = new Set(
  [
    CrmSyncLocationKey.city,
    CrmSyncLocationKey.region,
    CrmSyncLocationKey.district,
    CrmSyncLocationKey.coordinates,
    CrmSyncLocationKey.latitude,
    CrmSyncLocationKey.longitude,
    CrmSyncLocationKey.street,
    CrmSyncLocationKey.building,
    "address",
    "Адреса",
    ...Object.values(GENERIC_LOCATION_KEYS),
  ].map(normalizeKey),
);

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
  const plainText = text
    .replace(HTML_LINE_BREAKS, "\n")
    .replace(HTML_TAGS, "")
    .replace(METADATA_BULLET_PATTERN, "")
    .replace(METADATA_SECTION_PATTERN, "");
  const metadata = new Map<string, string>();
  const knownKeys = [
    ...Object.keys(ATTRIBUTE_LABELS),
    ...Object.values(ATTRIBUTE_LABELS),
    ...Object.values(GENERIC_LOCATION_KEYS),
    CrmSyncLocationKey.city,
    CrmSyncLocationKey.region,
    CrmSyncLocationKey.district,
    CrmSyncLocationKey.coordinates,
    CrmSyncLocationKey.latitude,
    CrmSyncLocationKey.longitude,
    CrmSyncLocationKey.street,
    CrmSyncLocationKey.building,
    "Адреса",
    "address",
  ].sort((left, right) => right.length - left.length);
  const keyPattern = new RegExp(
    `(?:^|\\s)(${knownKeys.map(escapeRegExp).join("|")}|[a-z][a-z0-9_-]*)\\s*:\\s*`,
    "giu",
  );
  const matches = [...plainText.matchAll(keyPattern)];

  for (const [index, match] of matches.entries()) {
    const key = normalizeKey(match[1]!);
    const valueStart = match.index! + match[0].length;
    const nextMatch = matches[index + 1];
    const valueEnd = nextMatch?.index ?? plainText.length;
    const value = plainText.slice(valueStart, valueEnd).trim();
    if (value) metadata.set(key, value);
  }

  return metadata;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const markerStart =
      marker.index +
      marker[0].search(new RegExp(`${escapeRegExp(ATTRIBUTES_OPEN_TAG)}|---`));
    const publicDescription = description
      .slice(0, markerStart)
      .replace(/<p(?:\s[^>]*)?>[\t ]*$/i, "")
      .trim();
    const closingTagIndex = description.indexOf(
      ATTRIBUTES_CLOSE_TAG,
      metadataStart,
    );
    const metadataEnd =
      closingTagIndex === -1 ? description.length : closingTagIndex;

    return {
      publicDescription,
      metadata: parseMetadata(description.slice(metadataStart, metadataEnd)),
    };
  },

  getLocation,
  normalizeAttributeKey: normalizeKey,
  getAttributeLabel(code: string): string {
    return ATTRIBUTE_LABELS[normalizeKey(code) as keyof typeof ATTRIBUTE_LABELS] ??
      code;
  },
  getAttributeCode(label: string): string | null {
    const normalizedLabel = normalizeKey(label);
    return ATTRIBUTE_CODES_BY_LABEL.get(normalizedLabel) ??
      (Object.hasOwn(ATTRIBUTE_LABELS, normalizedLabel)
        ? normalizedLabel
        : null);
  },
  translateAttributeValue(code: string, value: string): string {
    return (
      ATTRIBUTE_VALUE_LABELS[normalizeKey(code)]?.[normalizeKey(value)] ??
      value
    );
  },
  getOlxAttributes(
    metadata: ReadonlyMap<string, string>,
  ): OlxAdvertAttribute[] {
    const attributes: OlxAdvertAttribute[] = [];
    for (const [key, value] of metadata) {
      if (LOCATION_METADATA_KEYS.has(key)) continue;

      const code = ATTRIBUTE_CODES_BY_LABEL.get(key) ?? key;
      const getOlxValue = (item: string): string =>
        ATTRIBUTE_VALUE_CODES.get(code)?.get(normalizeKey(item)) ?? item;
      if (MULTI_VALUE_ATTRIBUTE_CODES.has(code)) {
        attributes.push({
          code,
          values: value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .map(getOlxValue),
        });
        continue;
      }

      attributes.push({ code, value: getOlxValue(value) });
    }

    return attributes;
  },
};
