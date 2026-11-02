import { z } from "zod";
import { USPACY_ROUTES } from "../types/constants/routes.js";
import type {
  CreateEntityRequest,
  UpdateEntityRequest,
} from "../types/domain/entity.js";
import {
  CreateEntityRequestSchema,
  EntitySchema,
  UpdateEntityRequestSchema,
} from "../types/domain/entity.js";
import type {
  CreateProductRequest,
  CreateProductsBulkRequest,
  Product,
  UpdateProductImagesRequest,
  UpdateProductRequest,
} from "../types/domain/product.js";
import {
  CreateProductRequestSchema,
  CreateProductsBulkRequestSchema,
  ListProductsResponseSchema,
  ProductSchema,
  UpdateProductImagesRequestSchema,
  UpdateProductRequestSchema,
} from "../types/domain/product.js";
import {
  UspacyDealProductsResponseSchema,
  UspacyDealResponseSchema,
} from "../types/domain/uspacy-deal.js";
import {
  OlxContactRequestSchema,
  OlxLeadRequestSchema,
  UspacyContactsResponseSchema,
  UspacyLeadResponseSchema,
  type OlxContactPayload,
  type OlxLeadPayload,
  type UspacyContact,
} from "../types/domain/uspacy-olx-lead.js";
import {
  createRequest,
  createRequestWithAuth,
  EmptyObjectSchema,
  NoRequestSchema,
} from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

const UspacySignInResponseSchema = z.object({
  jwt: z.string().min(1),
  expireInSeconds: z.number().positive().optional(),
});
const UspacyFilesResponseSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.union([z.number(), z.string()]),
        url: z.url(),
      })
      .loose(),
  ),
});
const UspacyUploadedFilesResponseSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.union([z.number(), z.string()]),
      })
      .loose(),
  ),
});
const UPLOAD_ENTITY_TYPE_FIELD = "entityType";
const UPLOAD_ENTITY_ID_FIELD = "entityId";
const UPLOAD_FILES_FIELD = "files[]";
const PRODUCT_ENTITY_TYPE = "products";
const OLX_IMAGE_FILE_NAME_PREFIX = "olx-image-";
const OLX_IMAGE_HOST_SUFFIXES = [".olx.ua", ".olxcdn.com"];

let cachedAccessToken: { token: string; expiresAt: number } | undefined;

export const UspacyService = {
  searchOlxContact: async ({
    phone,
    email,
  }: {
    phone?: string;
    email?: string;
  }): Promise<UspacyContact | undefined> => {
    if (!phone && !email) return undefined;

    const response = await createRequestWithAuth(
      USPACY_ROUTES.searchContacts.url(phone, email),
      await getUspacyAccessToken(),
      {
        method: USPACY_ROUTES.searchContacts.method,
        requestSchema: NoRequestSchema,
        responseSchema: UspacyContactsResponseSchema,
      },
    );
    const normalizedPhone = phone?.replace(/\D/g, "");
    const normalizedEmail = email?.toLowerCase();

    return response.data.find((contact) => {
      const phoneMatch =
        normalizedPhone &&
        contact.phone?.some(
          (entry) => entry.value.replace(/\D/g, "") === normalizedPhone,
        );
      const emailMatch =
        normalizedEmail &&
        contact.email?.some(
          (entry) => entry.value.toLowerCase() === normalizedEmail,
        );
      return Boolean(phoneMatch || emailMatch);
    });
  },
  createOlxContact: async ({
    payload,
  }: {
    payload: OlxContactPayload;
  }): Promise<UspacyContact> => {
    const { data } = await createRequestWithAuth(
      USPACY_ROUTES.createContact.url,
      await getUspacyAccessToken(),
      {
        method: USPACY_ROUTES.createContact.method,
        requestSchema: OlxContactRequestSchema,
        responseSchema: UspacyContactsResponseSchema,
        body: { data: [payload] },
      },
    );
    const contact = data[0];
    if (!contact) throw new Error("Uspacy returned no created Contact");
    return contact;
  },
  createOlxLead: async ({
    payload,
  }: {
    payload: OlxLeadPayload;
  }): Promise<void> => {
    await createRequestWithAuth(
      USPACY_ROUTES.createLead.url,
      await getUspacyAccessToken(),
      {
        method: USPACY_ROUTES.createLead.method,
        requestSchema: OlxLeadRequestSchema,
        responseSchema: UspacyLeadResponseSchema,
        body: { data: [payload] },
      },
    );
  },
  getProductFileUrls: async ({
    productId,
    fileIds,
  }: {
    productId: string;
    fileIds: string[];
  }): Promise<string[]> => {
    const entityId = Number(productId);
    if (!Number.isSafeInteger(entityId) || entityId <= 0) {
      throw new Error(
        `Cannot resolve Uspacy files for product ${productId}: product ID must be a positive integer`,
      );
    }

    const accessToken = await getUspacyAccessToken();
    const { data } = await createRequestWithAuth(
      USPACY_ROUTES.getFiles.url("products", entityId),
      accessToken,
      {
        method: USPACY_ROUTES.getFiles.method,
        requestSchema: NoRequestSchema,
        responseSchema: UspacyFilesResponseSchema,
      },
    );
    Logger.info("Uspacy files returned for product", {
      productId,
      requestedFileIds: fileIds,
      files: data.map(({ id, ...file }) => ({
        id: String(id),
        fields: Object.keys(file),
      })),
    });
    const urlsById = new Map(data.map((file) => [String(file.id), file.url]));
    const missingIds = fileIds.filter((fileId) => !urlsById.has(fileId));
    if (missingIds.length) {
      Logger.warn("Skipping foto file IDs missing from Uspacy files response", {
        productId,
        missingFileIds: missingIds,
      });
    }

    return fileIds.flatMap((fileId) => {
      const url = urlsById.get(fileId);
      return url ? [url] : [];
    });
  },
  uploadProductImages: async ({
    productId,
    imageUrls,
  }: {
    productId: string;
    imageUrls: string[];
  }): Promise<string[]> => {
    const entityId = Number(productId);
    if (!Number.isSafeInteger(entityId) || entityId <= 0) {
      throw new Error(
        `Cannot upload Uspacy files for product ${productId}: product ID must be a positive integer`,
      );
    }

    const formData = new FormData();
    formData.append(UPLOAD_ENTITY_TYPE_FIELD, PRODUCT_ENTITY_TYPE);
    formData.append(UPLOAD_ENTITY_ID_FIELD, String(entityId));

    for (const [index, imageUrl] of imageUrls.entries()) {
      const sourceUrl = validateOlxImageUrl(imageUrl);
      const imageResponse = await fetch(sourceUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `OLX image download failed [${imageResponse.status}] for ${sourceUrl.hostname}`,
        );
      }

      const image = await imageResponse.blob();
      if (!image.type.startsWith("image/")) {
        throw new Error(
          `OLX image response has an invalid content type for ${sourceUrl.hostname}`,
        );
      }

      formData.append(
        UPLOAD_FILES_FIELD,
        image,
        `${OLX_IMAGE_FILE_NAME_PREFIX}${index + 1}`,
      );
    }

    const response = await fetch(USPACY_ROUTES.uploadFiles.url, {
      method: USPACY_ROUTES.uploadFiles.method,
      headers: {
        Authorization: `Bearer ${await getUspacyAccessToken()}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Uspacy file upload failed [${response.status}]: ${errorBody}`,
      );
    }

    const { data } = UspacyUploadedFilesResponseSchema.parse(
      await response.json(),
    );
    if (data.length !== imageUrls.length) {
      throw new Error(
        `Uspacy uploaded ${data.length} files for ${imageUrls.length} OLX images`,
      );
    }

    Logger.info("Uploaded OLX images to Uspacy", {
      productId,
      fileCount: data.length,
    });
    return data.map(({ id }) => String(id));
  },
  getProduct: async (productId: string) => {
    const response = await createRequest(
      USPACY_ROUTES.getProduct.url(productId),
      {
        method: USPACY_ROUTES.getProduct.method,
        requestSchema: NoRequestSchema,
        responseSchema: ProductSchema,
      },
    );

    Logger.info("Full Uspacy product response", {
      productId,
      response,
    });
    return response;
  },
  getDeal: async (dealId: string) => {
    return createRequestWithAuth(
      USPACY_ROUTES.getDeal.url(dealId),
      await getUspacyAccessToken(),
      {
        method: USPACY_ROUTES.getDeal.method,
        requestSchema: NoRequestSchema,
        responseSchema: UspacyDealResponseSchema,
      },
    );
  },
  getDealProducts: async (dealId: string) => {
    return createRequestWithAuth(
      USPACY_ROUTES.getDealProducts.url(dealId),
      await getUspacyAccessToken(),
      {
        method: "GET",
        requestSchema: NoRequestSchema,
        responseSchema: UspacyDealProductsResponseSchema,
      },
    );
  },
  listProducts: async (page: number, list: number) => {
    const response = await createRequest(
      USPACY_ROUTES.listProducts.url(page, list),
      {
        method: USPACY_ROUTES.listProducts.method,
        requestSchema: NoRequestSchema,
        responseSchema: ListProductsResponseSchema,
      },
    );

    Logger.info("Posts retrived successfully!", response);
    return response;
  },
  createProduct: async ({ payload }: { payload: CreateProductRequest }) => {
    const response = await createRequest(USPACY_ROUTES.createProduct.url, {
      method: USPACY_ROUTES.createProduct.method,
      requestSchema: CreateProductRequestSchema,
      responseSchema: ProductSchema,
      body: payload,
    });

    Logger.info("Product was successfully created!", response);
    return response;
  },
  createBulkProducts: async ({
    payload,
  }: {
    payload: CreateProductsBulkRequest;
  }) => {
    const response = await createRequest(USPACY_ROUTES.bulkCreateProducts.url, {
      method: USPACY_ROUTES.bulkCreateProducts.method,
      requestSchema: CreateProductsBulkRequestSchema,
      responseSchema: EmptyObjectSchema,
      body: payload,
    });

    Logger.info("Products (bulk) were successfully created!", response);
    return response;
  },
  updateProduct: async ({
    productId,
    payload,
  }: {
    productId: string;
    payload: UpdateProductRequest;
  }) => {
    const response = await createRequest(
      USPACY_ROUTES.updateProduct.url(productId),
      {
        method: USPACY_ROUTES.updateProduct.method,
        requestSchema: UpdateProductRequestSchema,
        responseSchema: ProductSchema,
        body: payload,
      },
    );

    Logger.info("Product was successfully updated!", response);
    return response;
  },
  updateProductImages: async ({
    productId,
    payload,
  }: {
    productId: string;
    payload: UpdateProductImagesRequest;
  }) => {
    const response = await createRequest(
      USPACY_ROUTES.updateProduct.url(productId),
      {
        method: USPACY_ROUTES.updateProduct.method,
        requestSchema: UpdateProductImagesRequestSchema,
        responseSchema: ProductSchema,
        body: payload,
      },
    );

    const additionalFotoCount = Array.isArray(response.additional)
      ? response.additional.reduce(
          (count, item) => count + (item.foto?.length ?? 0),
          0,
        )
      : (response.additional?.foto?.length ?? 0);
    Logger.info("Uspacy product images updated", {
      productId,
      previewImageId: response.previewImageId,
      fotoCount: additionalFotoCount,
    });
    return response;
  },
  setProductInactive: async ({ productId }: { productId: string }) => {
    const response = await createRequest(
      USPACY_ROUTES.updateProduct.url(productId),
      {
        method: USPACY_ROUTES.updateProduct.method,
        requestSchema: z.object({ isActive: z.literal(false) }),
        responseSchema: z
          .object({
            id: z.union([z.string(), z.number()]).optional(),
            isActive: z.boolean().optional(),
          })
          .transform(() => undefined),
        body: { isActive: false },
      },
    );

    Logger.info("Uspacy product marked inactive", { productId });
    return response;
  },
  deleteProduct: async ({ productId }: { productId: string }) => {
    const response = await createRequest(
      USPACY_ROUTES.deleteProduct.url(productId),
      {
        method: USPACY_ROUTES.deleteProduct.method,
        requestSchema: NoRequestSchema,
        responseSchema: EmptyObjectSchema,
      },
    );

    Logger.info("Product was successfully deleted!", productId);
    return response;
  },
  createEntity: async ({ payload }: { payload: CreateEntityRequest }) => {
    const response = await createRequest(USPACY_ROUTES.createEntity.url, {
      method: USPACY_ROUTES.createEntity.method,
      requestSchema: CreateEntityRequestSchema,
      responseSchema: EntitySchema,
      body: payload,
    });

    Logger.info("Entity was successfully created!", response);
    return response;
  },
  updateEntity: async ({
    entityId,
    payload,
  }: {
    entityId: string;
    payload: UpdateEntityRequest;
  }) => {
    const response = await createRequest(
      USPACY_ROUTES.updateEntity.url(entityId),
      {
        method: USPACY_ROUTES.updateEntity.method,
        requestSchema: UpdateEntityRequestSchema,
        responseSchema: EntitySchema,
        body: payload,
      },
    );

    Logger.info("Entity was successfully updated!", response);
    return response;
  },
  deleteEntity: async ({ entityId }: { entityId: string }) => {
    const response = await createRequest(
      USPACY_ROUTES.deleteEntity.url(entityId),
      {
        method: USPACY_ROUTES.deleteEntity.method,
        requestSchema: NoRequestSchema,
        responseSchema: EmptyObjectSchema,
      },
    );

    Logger.info("Entity was successfully deleted!", entityId);
    return response;
  },
  getRecentProducts: async () => {
    let allProducts: Product[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 20;
    const maxPages = 100;

    while (hasMore && page <= maxPages) {
      const response = await UspacyService.listProducts(page, limit);
      const items = response.data;

      if (items.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(items);

        if (items.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    if (hasMore) {
      throw new Error(`Uspacy product pagination exceeded ${maxPages} pages`);
    }

    Logger.info(
      `[UspacyService] Fetched ${allProducts.length} recent products from Uspacy for cache.`,
    );
    return allProducts;
  },
};

async function getUspacyAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const email = process.env.USPACY_USER_EMAIL?.trim();
  const password = process.env.USPACY_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing USPACY_USER_EMAIL or USPACY_USER_PASSWORD for Uspacy file lookup",
    );
  }

  const response = await fetch(USPACY_ROUTES.signIn.url, {
    method: USPACY_ROUTES.signIn.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Uspacy sign-in request failed [${response.status}]: ${errorBody}`,
    );
  }

  const signInResponse = UspacySignInResponseSchema.parse(
    await response.json(),
  );
  if (signInResponse.expireInSeconds) {
    cachedAccessToken = {
      token: signInResponse.jwt,
      expiresAt:
        Date.now() + Math.max(signInResponse.expireInSeconds - 60, 0) * 1000,
    };
  }
  return signInResponse.jwt;
}

function validateOlxImageUrl(imageUrl: string): URL {
  const sourceUrl = new URL(imageUrl);
  if (
    sourceUrl.protocol !== "https:" ||
    !OLX_IMAGE_HOST_SUFFIXES.some((suffix) =>
      sourceUrl.hostname.endsWith(suffix),
    )
  ) {
    throw new Error(`Unsupported OLX image URL host: ${sourceUrl.hostname}`);
  }

  return sourceUrl;
}
