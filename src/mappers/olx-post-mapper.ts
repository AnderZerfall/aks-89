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
const METADATA_LINE_SEPARATOR = "\n";
const ATTRIBUTE_VALUE_SEPARATOR = ", ";

export const OlxPostMapper = {
  toDomain,
};

function toDomain(dto: OlxEnrichedAdvert): CreateProductRequest {
  const priceValue = Number(dto.price.value);
  if (!Number.isFinite(priceValue)) {
    throw new Error(`Invalid OLX price value: ${dto.price.value}`);
  }
  const currency = dto.price.currency;

  const isActive = dto.status === "active";
  const availability: ProductAvailability = isActive
    ? ProductAvailability.Available
    : ProductAvailability.NotAvailable;

  const cleanLink = (dto.url || dto.externalUrl || "").replace(
    /^https?:\/\//i,
    "",
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
      .join("\n\n"),
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
  ];

  for (const attribute of dto.attributes ?? []) {
    const values = getAttributeValues(attribute);
    if (values.length) {
      metadata.push(
        formatMetadataLine(
          CrmSyncUtil.getAttributeLabel(attribute.code),
          values.join(ATTRIBUTE_VALUE_SEPARATOR),
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
  const safeValue = value.replace(/[\r\n|]+/g, " ").trim();
  return `${key}: ${safeValue}`;
}

function getCoordinates(dto: OlxEnrichedAdvert): string {
  const { latitude, longitude } = dto.location ?? {};
  return latitude != null && longitude != null
    ? `${latitude}, ${longitude}`
    : "";
}

function getAttributeValues(attribute: OlxAdvertAttribute): string[] {
  return [
    ...(attribute.value ? [attribute.value] : []),
    ...(attribute.values ?? []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}
