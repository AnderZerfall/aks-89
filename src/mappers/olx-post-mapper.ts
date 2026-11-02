import {
  CrmSyncLocationKey,
  LocationCommentKey,
  Placeholder,
  ProductAvailability,
  ProductMeasurement,
  ProductType,
} from "../types/constants/product.js";
import { type CreateProductRequest } from "../types/domain/product.js";
import type { OlxAdvertAttribute } from "../types/dto/olx/olx-advert-attribute.js";
import type { OlxEnrichedAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import { DescriptionBuilder } from "../utils/description-util.js";
import { CrmSyncUtil } from "../utils/crm-sync-util.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

const ATTRIBUTES_OPEN_TAG = "[Атрибути]";
const ATTRIBUTES_CLOSE_TAG = "[/Атрибути]";
const METADATA_LINE_SEPARATOR = "<br>";
const ATTRIBUTE_VALUE_SEPARATOR = ", ";
const LOCATION_SECTION_TITLE = "ЛОКАЦІЯ";
const ATTRIBUTES_SECTION_TITLE = "ХАРАКТЕРИСТИКИ";
const EMPTY_STRING = "";
const BLANK_METADATA_LINE = EMPTY_STRING;
const DESCRIPTION_SECTION_SEPARATOR = "\n\n";
const SAFE_METADATA_SEPARATOR = " ";
const ACTIVE_ADVERT_STATUS = "active";
const INVALID_PRICE_ERROR = (value: string | number) =>
  `Invalid OLX price value: ${value}`;
const METADATA_BULLET_PREFIX = "• ";
const METADATA_KEY_VALUE_SEPARATOR = ": ";
const COORDINATE_SEPARATOR = ", ";
const LINK_PROTOCOL_PATTERN = /^https?:\/\//i;
const UNSAFE_METADATA_CHARACTERS_PATTERN = /[\r\n|]+/g;

export const OlxPostMapper = {
  toDomain,
};

function toDomain(dto: OlxEnrichedAdvert): CreateProductRequest {
  const priceValue = Number(dto.price.value);
  if (!Number.isFinite(priceValue)) {
    throw new Error(INVALID_PRICE_ERROR(dto.price.value));
  }
  const currency = dto.price.currency;

  const isActive = dto.status === ACTIVE_ADVERT_STATUS;
  const availability: ProductAvailability = isActive
    ? ProductAvailability.Available
    : ProductAvailability.NotAvailable;

  const cleanLink = (dto.url || dto.externalUrl || EMPTY_STRING).replace(
    LINK_PROTOCOL_PATTERN,
    EMPTY_STRING,
  );

  return {
    productCategoryId: ProductCategoryMapper.toUspacy(dto.categoryId),
    measurementUnitId: ProductMeasurement.SquareMeters,
    title: dto.title,
    article: dto.externalId || dto.id.toString(),
    type: ProductType.Goods,
    availability: availability,
    quantity: 1,
    reservedQuantity: 0,
    description: [
      DescriptionBuilder.build(dto.description),
      buildCrmSyncBlock(dto),
    ]
      .filter(Boolean)
      .join(DESCRIPTION_SECTION_SEPARATOR),
    link: cleanLink,
    prices: [
      {
        priceTypeId: 1,
        price: Price.toMinorUnits(priceValue, currency),
        currency: currency,
      },
    ],
  };
}

function buildCrmSyncBlock(dto: OlxEnrichedAdvert): string {
  const metadata = [
    LOCATION_SECTION_TITLE,
    formatMetadataLine(CrmSyncLocationKey.city, dto.enrichedLocation.city),
    formatMetadataLine(CrmSyncLocationKey.region, dto.enrichedLocation.region),
    formatMetadataLine(
      CrmSyncLocationKey.district,
      dto.enrichedLocation.district,
    ),
    formatMetadataLine(CrmSyncLocationKey.coordinates, getCoordinates(dto)),
    formatMetadataLine(
      LocationCommentKey.address,
      dto.enrichedLocation.address || Placeholder.NotFound,
    ),
    BLANK_METADATA_LINE,
    ATTRIBUTES_SECTION_TITLE,
  ];

  for (const attribute of dto.attributes ?? []) {
    const values = getAttributeValues(attribute);
    if (values.length) {
      metadata.push(
        formatMetadataLine(
          CrmSyncUtil.getAttributeLabel(attribute.code),
          values
            .map((value) =>
              CrmSyncUtil.translateAttributeValue(attribute.code, value),
            )
            .join(ATTRIBUTE_VALUE_SEPARATOR),
        ),
      );
    }
  }

  return [
    ATTRIBUTES_OPEN_TAG,
    ...metadata,
    ATTRIBUTES_CLOSE_TAG,
  ].join(METADATA_LINE_SEPARATOR);
}

function formatMetadataLine(key: string, value: string): string {
  const safeValue = value
    .replace(UNSAFE_METADATA_CHARACTERS_PATTERN, SAFE_METADATA_SEPARATOR)
    .trim();
  return `${METADATA_BULLET_PREFIX}${key}${METADATA_KEY_VALUE_SEPARATOR}${safeValue}`;
}

function getCoordinates(dto: OlxEnrichedAdvert): string {
  const { latitude, longitude } = dto.location ?? {};
  return latitude != null && longitude != null
    ? `${latitude}${COORDINATE_SEPARATOR}${longitude}`
    : EMPTY_STRING;
}

function getAttributeValues(attribute: OlxAdvertAttribute): string[] {
  return [
    ...(attribute.value ? [attribute.value] : []),
    ...(attribute.values ?? []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}
