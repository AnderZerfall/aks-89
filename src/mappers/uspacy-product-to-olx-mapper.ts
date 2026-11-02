import type { Product } from "../types/domain/product.js";
import type { CreateOlxAdvertRequestDto } from "../types/dto/olx/olx-adverts.dto.js";
import type { OlxContactDto } from "../types/dto/olx/olx-contact.dto.js";
import { CrmSyncUtil } from "../utils/crm-sync-util.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

export const UspacyProductToOlxMapper = {
  toCreateRequest: (
    product: Product,
    images: string[],
    location: CreateOlxAdvertRequestDto["location"],
    contact: OlxContactDto,
    existingCategoryId: number | undefined,
  ): CreateOlxAdvertRequestDto | null => {
    const categoryId =
      existingCategoryId ??
      ProductCategoryMapper.toOlx(product.productCategoryId);
    if (categoryId === undefined) {
      console.error(
        `Cannot create OLX payload for product ${product.id}: no category mapping for Uspacy category ${product.productCategoryId}`,
      );
      return null;
    }

    const productPrice = product.prices[0];
    if (!productPrice) {
      console.error(
        `Cannot create OLX payload for product ${product.id}: product has no price`,
      );
      return null;
    }
    if (
      !Number.isFinite(productPrice.price) ||
      productPrice.price <= 0 ||
      !productPrice.currency.trim()
    ) {
      console.error(
        `Cannot create OLX payload for product ${product.id}: price or currency is invalid`,
      );
      return null;
    }

    const validImages = images.filter(Boolean);
    if (!validImages.length) {
      console.error(
        `Cannot create OLX payload for product ${product.id}: at least one image is required`,
      );
      return null;
    }

    const productDescription = CrmSyncUtil.parseProductDescription(
      product.description,
    );
    const publicDescription =
      product.comment ?? productDescription.publicDescription;
    const metadata = productDescription.metadata;
    const { value, currency } = Price.fromMinorUnits(
      productPrice.price,
      productPrice.currency,
    );

    return {
      title: product.title,
      description: publicDescription,
      categoryId,
      advertiserType: "business",
      location,
      contact,
      attributes: CrmSyncUtil.getOlxAttributes(metadata),
      price: {
        value,
        currency,
        negotiable: false,
        trade: false,
        budget: false,
      },
      images: validImages.map((url) => ({ url })),
      externalId: product.article,
      ...(product.link ? { externalUrl: product.link } : {}),
    };
  },
};
