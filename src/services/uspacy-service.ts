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
  UpdateProductRequest,
} from "../types/domain/product.js";
import {
  CreateProductRequestSchema,
  CreateProductsBulkRequestSchema,
  ListProductsResponseSchema,
  ProductSchema,
  UpdateProductRequestSchema,
} from "../types/domain/product.js";
import {
  createRequest,
  EmptyObjectSchema,
  NoRequestSchema,
} from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

export const UspacyService = {
  getProduct: async (productId: string) => {
    const response = await createRequest(
      USPACY_ROUTES.getProduct.url(productId),
      {
        method: USPACY_ROUTES.getProduct.method,
        requestSchema: NoRequestSchema,
        responseSchema: ProductSchema,
      },
    );

    Logger.info("Posts retrived successfully!", response);
    return response;
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
    const response = await createRequest(
      USPACY_ROUTES.createProduct.url,
      {
        method: USPACY_ROUTES.createProduct.method,
        requestSchema: CreateProductRequestSchema,
        responseSchema: ProductSchema,
        body: payload,
      },
    );

    Logger.info("Product was successfully created!", response);
    return response;
  },
  createBulkProducts: async ({
    payload,
  }: {
    payload: CreateProductsBulkRequest;
  }) => {
    const response = await createRequest(
      USPACY_ROUTES.bulkCreateProducts.url,
      {
        method: USPACY_ROUTES.bulkCreateProducts.method,
        requestSchema: CreateProductsBulkRequestSchema,
        responseSchema: EmptyObjectSchema,
        body: payload,
      },
    );

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
    const response = await createRequest(
      USPACY_ROUTES.createEntity.url,
      {
        method: USPACY_ROUTES.createEntity.method,
        requestSchema: CreateEntityRequestSchema,
        responseSchema: EntitySchema,
        body: payload,
      },
    );

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
