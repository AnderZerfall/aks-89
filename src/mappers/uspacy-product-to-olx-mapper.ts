import type { Product } from "../types/domain/product.js";
import type { CreateOlxAdvertRequestDto } from "../types/dto/olx/olx-adverts.dto.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

export const UspacyProductToOlxMapper = {
  toCreateRequest: (
    product: Product,
    images: string[],
    location: CreateOlxAdvertRequestDto["location"],
    existingCategoryId?: number,
  ): CreateOlxAdvertRequestDto => {
    const categoryId =
      ProductCategoryMapper.toOlx(product.productCategoryId) ??
      existingCategoryId;
    if (categoryId === undefined) {
      throw new Error(
        `No OLX category mapping configured for Uspacy category ${product.productCategoryId}`,
      );
    }

    const productPrice = product.prices[0];
    if (!productPrice) {
      throw new Error(`Uspacy product ${product.id} has no price`);
    }

    const { value, currency } = Price.fromMinorUnits(
      productPrice.price,
      productPrice.currency,
    );
    return {
      title: product.title,
      description: product.description,
      categoryId,
      advertiserType: "business",
      location,
      price: {
        value,
        currency,
        negotiable: false,
        trade: false,
        budget: false,
      },
      images: images.map((url) => ({ url })),
      externalId: product.article,
      ...(product.link ? { externalUrl: product.link } : {}),
    };
  },
};
