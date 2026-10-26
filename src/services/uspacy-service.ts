import { USPACY_ROUTES } from "../types/constants/routes.js";
import type {
  CreateEntityRequest,
  Entity,
  UpdateEntityRequest,
} from "../types/domain/entity.js";
import type {
  CreateProductRequest,
  CreateProductsBulkRequest,
  Product,
  UpdateProductRequest,
} from "../types/domain/product.js";
import { createRequest } from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

export const UspacyService = {
  getProduct: async (productId: string) => {
    const response = await createRequest<{}, Product>(
      USPACY_ROUTES.getProduct.url(productId),
      {
        method: USPACY_ROUTES.getProduct.method,
      },
    );

    if (!response) {
      Logger.info("Product was not found", productId);
    }

    Logger.info("Posts retrived successfully!", response);
    return response;
  },
  listProducts: async (page: number, list: number) => {
    const response = await createRequest<{}, { data: Product[] }>(
      USPACY_ROUTES.listProducts.url(page, list),
      {
        method: USPACY_ROUTES.listProducts.method,
      },
    );

    Logger.info("Posts retrived successfully!", response);
    return response;
  },
  createProduct: async ({ payload }: { payload: CreateProductRequest }) => {
    const response = await createRequest<CreateProductRequest, Product>(
      USPACY_ROUTES.createProduct.url,
      {
        method: USPACY_ROUTES.createProduct.method,
        body: payload,
      },
    );

    if (!response) {
      Logger.error("Something went wrong during creation", response);
    }

    Logger.info("Product was successfully created!", response);
    return response;
  },
  createBulkProducts: async ({
    payload,
  }: {
    payload: CreateProductsBulkRequest;
  }) => {
    const response = await createRequest<CreateProductsBulkRequest, {}>(
      USPACY_ROUTES.bulkCreateProducts.url,
      {
        method: USPACY_ROUTES.bulkCreateProducts.method,
        body: payload,
      },
    );

    if (!response) {
      Logger.error("Something went wrong during creation", response);
    }

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
    const response = await createRequest<UpdateProductRequest, Product>(
      USPACY_ROUTES.updateProduct.url(productId),
      {
        method: USPACY_ROUTES.updateProduct.method,
        body: payload,
      },
    );

    if (!response) {
      Logger.info("Something went wrong during update");
    }

    Logger.info("Product was successfully updated!", response);
    return response;
  },
  deleteProduct: async ({ productId }: { productId: string }) => {
    const response = await createRequest<{}, {}>(
      USPACY_ROUTES.deleteProduct.url(productId),
      {
        method: USPACY_ROUTES.deleteProduct.method,
      },
    );

    Logger.info("Product was successfully deleted!", productId);
    return response;
  },
  createEntity: async ({ payload }: { payload: CreateEntityRequest }) => {
    const response = await createRequest<CreateEntityRequest, Entity>(
      USPACY_ROUTES.createEntity.url,
      {
        method: USPACY_ROUTES.createEntity.method,
        body: payload,
      },
    );

    if (!response) {
      Logger.error("Something went wrong during creation", response);
    }

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
    const response = await createRequest<UpdateEntityRequest, Entity>(
      USPACY_ROUTES.updateEntity.url(entityId),
      {
        method: USPACY_ROUTES.updateEntity.method,
        body: payload,
      },
    );

    if (!response) {
      Logger.info("Something went wrong during update");
    }

    Logger.info("Entity was successfully updated!", response);
    return response;
  },
  deleteEntity: async ({ entityId }: { entityId: string }) => {
    const response = await createRequest<{}, {}>(
      USPACY_ROUTES.deleteEntity.url(entityId),
      {
        method: USPACY_ROUTES.deleteEntity.method,
      },
    );

    Logger.info("Entity was successfully deleted!", entityId);
    return response;
  },
  getRecentProducts: async () => {
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 20;
    const maxPages = 5;

    while (hasMore && page <= maxPages) {
      try {
        const response = await UspacyService.listProducts(page, limit);

        const items = response?.data || [];

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
      } catch (error) {
        Logger.error(
          `[UspacyService] Failed to fetch products page ${page}:`,
          error,
        );
        hasMore = false;
      }
    }

    Logger.info(
      `[UspacyService] Fetched ${allProducts.length} recent products from Uspacy for cache.`,
    );
    return allProducts;
  },
};
