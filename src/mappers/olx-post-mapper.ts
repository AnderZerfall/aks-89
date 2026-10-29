import {
  ProductAvailability,
  ProductMeasurement,
  ProductType,
} from "../types/constants/product.js";
import { type CreateProductRequest } from "../types/domain/product.js";
import type { OlxEnrichedAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import { DescriptionBuilder } from "../utils/description-util.js";
import { CommentBuilder } from "../utils/location-util.js";
import { Money } from "../utils/money.js";
import { OlxUspacyCategoryMapper } from "./olx-uspacy-category-mapper.js";

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
    product_category_id: OlxUspacyCategoryMapper.toUspacy(dto.category_id),
    measurement_unit_id: ProductMeasurement.SquareMeters,
    title: dto.title,
    article: dto.external_id || dto.id.toString(),
    type: ProductType.Goods,
    is_active: isActive,
    availability: availability,
    quantity: 1,
    reserved_quantity: 0,
    description: DescriptionBuilder.build(dto.description, imageUrls),
    comment,
    link: cleanLink,
    prices: [
      {
        price_type_id: 1,
        price: Money.toMinorUnits(priceValue, currency),
        currency,
      },
    ],
  };
}
