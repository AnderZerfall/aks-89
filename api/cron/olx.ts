import { ProductCategoryMapper } from "../../src/mappers/product-category-mapper.js";
import { UspacyProductToOlxMapper } from "../../src/mappers/uspacy-product-to-olx-mapper.js";
import { CloudinaryImageService } from "../../src/services/cloudinary-image-service.js";
import { OlxService } from "../../src/services/olx-service.js";
import { OlxSyncStateService } from "../../src/services/olx-sync-state-service.js";
import { UspacyService } from "../../src/services/uspacy-service.js";
import type { Product } from "../../src/types/domain/product.js";
import type {
  CreateOlxAdvertRequestDto,
  OlxAdvert,
} from "../../src/types/dto/olx/olx-adverts.dto.js";
import { createHandler } from "../../src/utils/create-handler.js";
import { CommentBuilder } from "../../src/utils/location-util.js";
import { Logger } from "../../src/utils/logger.js";

type SyncCounts = {
  created: number;
  updated: number;
  statusChanges: number;
  skipped: number;
};

const handler = createHandler(synchronizeOlxPosts);

async function synchronizeOlxPosts() {
  const syncStartedAt = new Date();
  const lastSuccessfulSync = await OlxSyncStateService.getLastSuccessfulSync();
  const syncCutoff = lastSuccessfulSync ?? syncStartedAt;
  const accessToken = await OlxService.refreshTokens();
  const olxPosts = await OlxService.getPosts(accessToken);
  const uspacyProducts = await UspacyService.getRecentProducts();
  const postsByArticle = indexOlxPostsByArticle(olxPosts);
  const counts: SyncCounts = {
    created: 0,
    updated: 0,
    statusChanges: 0,
    skipped: 0,
  };

  Logger.info("Starting OLX/Uspacy synchronization", {
    products: uspacyProducts.length,
    olxPosts: olxPosts.length,
    syncCutoff: syncCutoff.toISOString(),
  });

  for (const product of uspacyProducts) {
    await synchronizeProduct({
      accessToken,
      product,
      postsByArticle,
      syncCutoff,
      counts,
    });
  }

  await OlxSyncStateService.saveSuccessfulSync(syncStartedAt);

  Logger.info("OLX/Uspacy synchronization completed", counts);
  return counts;
}

function indexOlxPostsByArticle(posts: OlxAdvert[]): Map<string, OlxAdvert> {
  return new Map(
    posts.map((post) => [post.externalId || post.id.toString(), post] as const),
  );
}

async function synchronizeProduct({
  accessToken,
  product,
  postsByArticle,
  syncCutoff,
  counts,
}: {
  accessToken: string;
  product: Product;
  postsByArticle: Map<string, OlxAdvert>;
  syncCutoff: Date;
  counts: SyncCounts;
}): Promise<void> {
  if (!product.article) {
    Logger.warn("Skipping Uspacy product without an article", {
      productId: product.id,
    });
    counts.skipped++;
    return;
  }

  const matchingPost = postsByArticle.get(product.article);
  if (!matchingPost) {
    if (ProductCategoryMapper.toOlx(product.productCategoryId) === undefined) {
      Logger.warn("Skipping product with unmapped OLX category", {
        article: product.article,
        productCategoryId: product.productCategoryId,
      });
      counts.skipped++;
      return;
    }

    const createdPost = await createOlxPost(accessToken, product);
    if (!createdPost) {
      counts.skipped++;
      return;
    }
    postsByArticle.set(product.article, createdPost);
    counts.created++;
    await synchronizePostStatus(accessToken, product, createdPost, counts);
    return;
  }

  if (wasUpdatedAfter(product, syncCutoff)) {
    const updatedPost = await updateOlxPost(accessToken, product, matchingPost);
    if (!updatedPost) {
      counts.skipped++;
      await synchronizePostStatus(accessToken, product, matchingPost, counts);
      return;
    }
    postsByArticle.set(product.article, updatedPost);
    counts.updated++;
    await synchronizePostStatus(accessToken, product, updatedPost, counts);
    return;
  }

  if (!product.updatedAt) {
    Logger.warn("Uspacy product has no updatedAt timestamp", {
      article: product.article,
    });
  }
  if (
    product.updatedAt &&
    Number.isNaN(new Date(product.updatedAt).getTime())
  ) {
    Logger.warn("Uspacy product has an invalid updatedAt timestamp", {
      article: product.article,
      updatedAt: product.updatedAt,
    });
  }
  await synchronizePostStatus(accessToken, product, matchingPost, counts);
}

function wasUpdatedAfter(product: Product, cutoff: Date): boolean {
  if (!product.updatedAt) return false;

  const updatedAt = new Date(product.updatedAt);
  return !Number.isNaN(updatedAt.getTime()) && updatedAt > cutoff;
}

async function createOlxPost(
  accessToken: string,
  product: Product,
): Promise<OlxAdvert | null> {
  const location = await getOlxLocationFromComment(accessToken, product);
  if (!location) return null;

  const images = await createWatermarkedImageUrls(product);
  const payload = UspacyProductToOlxMapper.toCreateRequest(
    product,
    images,
    location,
  );

  return OlxService.createPost({ accessToken, payload });
}

async function updateOlxPost(
  accessToken: string,
  product: Product,
  matchingPost: OlxAdvert,
): Promise<OlxAdvert | null> {
  const location = await getOlxLocationFromComment(accessToken, product);
  if (!location) return null;

  const images = await createWatermarkedImageUrls(product);
  const payload = UspacyProductToOlxMapper.toCreateRequest(
    product,
    images,
    location,
    matchingPost.categoryId,
  );

  return OlxService.updatePost({
    accessToken,
    advertId: matchingPost.id.toString(),
    payload,
  });
}

async function createWatermarkedImageUrls(product: Product): Promise<string[]> {
  const sourceUrls = product.files ?? [];
  const publicIdPrefix = (product.article || product.id)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 100);

  return Promise.all(
    sourceUrls.map((url, index) =>
      CloudinaryImageService.uploadWatermarkedImage(
        url,
        `${publicIdPrefix}-${index + 1}`,
      ),
    ),
  );
}

async function getOlxLocationFromComment(
  accessToken: string,
  product: Product,
): Promise<CreateOlxAdvertRequestDto["location"] | null> {
  const parsedLocation = CommentBuilder.parseLocationFromComment(
    product.comment,
  );
  const latitude = Number(parsedLocation?.latitude);
  const longitude = Number(parsedLocation?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    Logger.warn("Skipping product with no valid coordinates in its comment", {
      productId: product.id,
    });
    return null;
  }

  const locationResponse = await OlxService.getLocations({
    accessToken,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });
  const match = locationResponse.data[0];
  if (!match) {
    Logger.warn("OLX could not resolve product coordinates", {
      productId: product.id,
    });
    return null;
  }

  return {
    cityId: match.city.id,
    ...(match.district ? { districtId: match.district.id } : {}),
    latitude,
    longitude,
  };
}

async function synchronizePostStatus(
  accessToken: string,
  product: Product,
  post: OlxAdvert,
  counts: SyncCounts,
): Promise<void> {
  const shouldBeActive = product.isActive;
  const isActive = post.status === "active";
  if (shouldBeActive === isActive) return;

  await OlxService.setPostStatus({
    accessToken,
    advertId: post.id.toString(),
    command: shouldBeActive ? "activate" : "deactivate",
  });
  counts.statusChanges++;
}

export default handler;
