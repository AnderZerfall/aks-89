import { z } from "zod";
import type { Product } from "../types/domain/product.js";
import type { OlxAdvertAttribute } from "../types/dto/olx/olx-advert-attribute.js";
import type { OlxContactDto } from "../types/dto/olx/olx-contact.dto.js";
import type { CreateOlxAdvertRequestDto } from "../types/dto/olx/olx-adverts.dto.js";
import { Price } from "../utils/price.js";
import { ProductCategoryMapper } from "./product-category-mapper.js";

const APARTMENT_ATTRIBUTE_CODES = [
  "floor",
  "total_floors",
  "total_area",
  "kitchen_area",
] as const;

const APARTMENT_ATTRIBUTE_LABELS = {
  floor: "Поверх",
  total_floors: "Кількість поверхів",
  total_area: "Загальна площа",
  kitchen_area: "Площа кухні",
} as const;

const ApartmentAttributesSchema = z
  .object({
    floor: z.coerce.number().int().positive(),
    total_floors: z.coerce.number().int().positive(),
    total_area: z.coerce.number().positive(),
    kitchen_area: z.coerce.number().positive(),
  })
  .refine((attributes) => attributes.floor <= attributes.total_floors, {
    path: ["floor"],
    message: "floor cannot exceed total_floors",
  });

export const UspacyOlxAttributeTemplate = [
  "[OLX_ATTRIBUTES]",
  `${APARTMENT_ATTRIBUTE_LABELS.floor}: `,
  `${APARTMENT_ATTRIBUTE_LABELS.total_floors}: `,
  `${APARTMENT_ATTRIBUTE_LABELS.total_area}: `,
  `${APARTMENT_ATTRIBUTE_LABELS.kitchen_area}: `,
  "[/OLX_ATTRIBUTES]",
].join("\n");

export const UspacyProductToOlxMapper = {
  toCreateRequest: (
    product: Product,
    images: string[],
    location: CreateOlxAdvertRequestDto["location"],
    contact: OlxContactDto,
    existingCategoryId?: number,
    existingAttributes?: OlxAdvertAttribute[],
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

    const { description, attributes } = getOlxDescriptionData(
      product.description,
      categoryId,
      existingAttributes,
    );
    const { value, currency } = Price.fromMinorUnits(
      productPrice.price,
      productPrice.currency,
    );
    return {
      title: product.title,
      description,
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
      images: images.map((url) => ({ url })),
      externalId: product.article,
      ...(product.link ? { externalUrl: product.link } : {}),
    };
  },
};

function getOlxDescriptionData(
  description: string,
  categoryId: number,
  existingAttributes?: OlxAdvertAttribute[],
): { description: string; attributes: OlxAdvertAttribute[] } {
  const block = /\[OLX_ATTRIBUTES\]([\s\S]*?)\[\/OLX_ATTRIBUTES\]/i.exec(
    description,
  );
  if (!block) {
    if (categoryId === 1757 && !existingAttributes?.length) {
      throw new Error(
        `Uspacy description must include the OLX attribute template:\n${UspacyOlxAttributeTemplate}`,
      );
    }
    return {
      description,
      attributes: existingAttributes ?? [],
    };
  }

  const values = new Map<string, string>();
  const attributeCodesByLabel = new Map(
    Object.entries(APARTMENT_ATTRIBUTE_LABELS).map(([code, label]) => [
      label.toLocaleLowerCase("uk"),
      code,
    ]),
  );
  const plainText = block[1]!
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  for (const line of plainText.split(/\r?\n/)) {
    const entry = /^\s*([^:]+)\s*:\s*(.*?)\s*$/.exec(line);
    if (!entry) continue;

    const label = entry[1]!.trim().toLocaleLowerCase("uk");
    const code = attributeCodesByLabel.get(label);
    if (code) values.set(code, entry[2]!);
  }

  if (categoryId !== 1757) {
    return {
      description: description.replace(block[0], "").trim(),
      attributes: [...values].map(([code, value]) => ({ code, value })),
    };
  }

  const missingCodes = APARTMENT_ATTRIBUTE_CODES.filter(
    (code) => !values.get(code)?.trim(),
  );
  if (missingCodes.length) {
    throw new Error(
      `Uspacy OLX attribute template is missing values for: ${missingCodes.join(", ")}`,
    );
  }

  const parsedAttributes = ApartmentAttributesSchema.safeParse(
    Object.fromEntries(
      APARTMENT_ATTRIBUTE_CODES.map((code) => [
        code,
        values.get(code)!.replace(",", "."),
      ]),
    ),
  );
  if (!parsedAttributes.success) {
    throw new Error(
      `Invalid Uspacy OLX attributes: ${parsedAttributes.error.message}`,
    );
  }

  const attributes = APARTMENT_ATTRIBUTE_CODES.map((code) => ({
    code,
    value: String(parsedAttributes.data[code]),
  }));
  return {
    description: description.replace(block[0], "").trim(),
    attributes,
  };
}
