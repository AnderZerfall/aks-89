import {
  ProductAvailability,
  ProductCategory,
  ProductMeasurement,
  ProductType,
  type Product,
} from "../types/domain/product.js";
import type { OlxAdvert } from "../types/dto/olx/olx-adverts.dto.js";

export const OlxPostMapper = {
  toDomain,
};

function toDomain(dto: OlxAdvert): Product {
  const priceValue = dto.price?.value || 0;
  const currency = dto.price?.currency || "UAH";

  const isActive = dto.status === "active";
  const availability: ProductAvailability = isActive
    ? ProductAvailability.Available
    : ProductAvailability.NotAvailable;

  const imageUrls = dto.images ? dto.images.map((img) => img.url) : [];

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
    description: dto.description || "",
    // comment: `Місто: ${dto.location?.city?.name || "Не вказано"}, Адреса: ${advert.location?.address || "Не вказана"}`,
    link: dto.url || dto.external_url,
    prices: [
      {
        price_type_id: 1,
        price: Number(priceValue),
        currency: currency,
      },
    ],
    files: imageUrls,
  };
}
