import type { Product } from "../types/domain/product.js";
import type { OlxCategoryAttribute } from "../types/dto/olx/olx-advert-attribute.js";
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
    categoryAttributes: OlxCategoryAttribute[],
  ): CreateOlxAdvertRequestDto | null => {
    const categoryId =
      ProductCategoryMapper.toOlx(product.productCategoryId) ??
      existingCategoryId;
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
    if (validImages.length === 0) {
      console.error(
        `Cannot create OLX payload for product ${product.id}: at least one image is required`,
      );
      return null;
    }

    const { publicDescription, metadata } = CrmSyncUtil.parseDescription(
      product.description,
    );
    const attributes = getOlxAttributes(
      product.id,
      metadata,
      categoryAttributes,
    );
    if (!attributes) return null;

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
      attributes,
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

function getOlxAttributes(
  productId: string,
  metadata: ReadonlyMap<string, string>,
  categoryAttributes: OlxCategoryAttribute[],
): CreateOlxAdvertRequestDto["attributes"] | null {
  const mappedAttributes: NonNullable<CreateOlxAdvertRequestDto["attributes"]> =
    [];
  const missingRequired: string[] = [];
  const invalidValues: string[] = [];

  for (const attribute of categoryAttributes) {
    const normalizedCode = CrmSyncUtil.normalizeAttributeKey(attribute.code);
    const normalizedLabel = CrmSyncUtil.normalizeAttributeKey(attribute.label);
    const input = metadata.get(normalizedCode) ?? metadata.get(normalizedLabel);

    if (!input) {
      if (attribute.validation?.required) {
        missingRequired.push(attribute.label);
      }
      continue;
    }

    let value = input.trim();
    if (!value) {
      if (attribute.validation?.required) {
        missingRequired.push(attribute.label);
      }
      continue;
    }

    if (attribute.validation?.numeric) {
      const numericValue = Number(value.replace(",", "."));
      if (!Number.isFinite(numericValue)) {
        invalidValues.push(`${attribute.label} must be numeric`);
        continue;
      }
      value = String(numericValue);
    } else if (attribute.values?.length) {
      const matchedValue = attribute.values.find(
        ({ code, label }) =>
          CrmSyncUtil.normalizeAttributeKey(code) ===
            CrmSyncUtil.normalizeAttributeKey(value) ||
          (label != null &&
            CrmSyncUtil.normalizeAttributeKey(label) ===
              CrmSyncUtil.normalizeAttributeKey(value)),
      );
      if (!matchedValue) {
        invalidValues.push(`${attribute.label} has an unsupported value`);
        continue;
      }
      value = matchedValue.code;
    }

    mappedAttributes.push({ code: attribute.code, value });
  }

  if (missingRequired.length || invalidValues.length) {
    if (missingRequired.length) {
      console.error(
        `Cannot create OLX payload for product ${productId}: CRM_SYNC is missing required ${categoryAttributes.length ? "category attributes" : "metadata"}: ${missingRequired.join(", ")}`,
      );
    }
    if (invalidValues.length) {
      console.error(
        `Cannot create OLX payload for product ${productId}: invalid CRM_SYNC attributes: ${invalidValues.join(", ")}`,
      );
    }
    return null;
  }

  if (categoryAttributes.length) {
    console.info(
      `Mapped ${mappedAttributes.length} CRM_SYNC attributes for product ${productId}`,
    );
  }
  return mappedAttributes;
}
