import {
  ProductAvailability,
  ProductCategory,
  ProductMeasurement,
  ProductType,
} from "../types/constants/product.js";
import { type CreateProductRequest } from "../types/domain/product.js";
import type { OlxEnrichedAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import { CommentBuilder } from "../utils/location-util.js";

export const OlxPostMapper = {
  toDomain,
};

function toDomain(dto: OlxEnrichedAdvert): CreateProductRequest {
  const priceValue = dto.price?.value || 0;
  const currency = dto.price?.currency || "UAH";

  const isActive = dto.status === "active";
  const availability: ProductAvailability = isActive
    ? ProductAvailability.Available
    : ProductAvailability.NotAvailable;

  const imageUrls = dto.images ? dto.images.map((img) => img.url) : [];

  const comment = CommentBuilder.buildLocationComment({
    city: dto.enrichedLocation?.city || null,
    region: dto.enrichedLocation?.region || null,
    district: dto.enrichedLocation?.district || null,
    address: dto.enrichedLocation?.address || null,
    latitude: dto.location?.latitude ? String(dto.location.latitude) : null,
    longitude: dto.location?.longitude ? String(dto.location.longitude) : null,
  });

  const cleanLink = (dto.url || dto.external_url || "").replace(
    /^https?:\/\//i,
    "",
  );

  return {
    product_category_id: ProductCategory.FlatSell,
    measurement_unit_id: ProductMeasurement.SquareMeters,
    title: dto.title,
    article: dto.external_id || dto.id.toString(),
    type: ProductType.Goods,
    is_active: isActive,
    availability: availability,
    quantity: 1,
    reserved_quantity: 0,
    description: [dto.description, ...imageUrls].filter(Boolean).join("\n"),
    comment,
    link: cleanLink,
    prices: [
      {
        price_type_id: 1,
        price: Number(priceValue),
        currency: currency,
      },
    ],
  };
}
