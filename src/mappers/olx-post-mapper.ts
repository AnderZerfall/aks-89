import {
  CrmSyncLocationKey,
  LocationCommentKey,
  ProductAvailability,
  ProductMeasurement,
  ProductType,
} from "../types/constants/product.js";
import { type CreateProductRequest } from "../types/domain/product.js";
import type { OlxAdvertAttribute } from "../types/dto/olx/olx-advert-attribute.js";
import type { OlxEnrichedAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import { DescriptionBuilder } from "../utils/description-util.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

const CRM_SYNC_HEADER = "--- CRM_SYNC:";
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
  ];

  if (dto.enrichedLocation.address) {
    metadata.push(
      formatMetadataLine(
        LocationCommentKey.address,
        dto.enrichedLocation.address,
      ),
    );
  }

  for (const attribute of dto.attributes ?? []) {
    const values = getAttributeValues(attribute);
    if (values.length) {
      metadata.push(
        formatMetadataLine(
          attribute.code,
          values.join(ATTRIBUTE_VALUE_SEPARATOR),
        ),
      );
    }
  }

  return [CRM_SYNC_HEADER, ...metadata].join(METADATA_LINE_SEPARATOR);
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
