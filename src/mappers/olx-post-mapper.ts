import {
  ProductAvailability,
  ProductMeasurement,
  ProductType,
} from "../types/constants/product.js";
import { type CreateProductRequest } from "../types/domain/product.js";
import type { OlxEnrichedAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import { DescriptionBuilder } from "../utils/description-util.js";
import { CommentBuilder } from "../utils/location-util.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

export const OlxPostMapper = {
  toDomain,
};

function toDomain(dto: OlxEnrichedAdvert): CreateProductRequest {
  const priceValue = dto.price.value;
  const currency = dto.price.currency;

  const isActive = dto.status === "active";
  const availability: ProductAvailability = isActive
    ? ProductAvailability.Available
    : ProductAvailability.NotAvailable;

  const imageUrls = dto.images ? dto.images.map((img) => img.url) : [];

  const comment = CommentBuilder.buildLocationComment({
    city: dto.enrichedLocation.city || null,
    region: dto.enrichedLocation.region || null,
    district: dto.enrichedLocation.district || null,
    address: dto.enrichedLocation.address || null,
    latitude:
      dto.location?.latitude != null ? String(dto.location.latitude) : null,
    longitude:
      dto.location?.longitude != null ? String(dto.location.longitude) : null,
  });

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
    isActive: isActive,
    availability: availability,
    quantity: 1,
    reservedQuantity: 0,
    description: DescriptionBuilder.build(dto.description, imageUrls),
    comment: comment,
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
