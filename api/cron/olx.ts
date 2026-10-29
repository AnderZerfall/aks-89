import { OlxPostMapper } from "../../src/mappers/olx-post-mapper.js";
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
  imported: number;
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
    imported: 0,
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

  await importOlxPostsToUspacy(accessToken, olxPosts, uspacyProducts, counts);

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

async function importOlxPostsToUspacy(
  accessToken: string,
  olxPosts: OlxAdvert[],
  uspacyProducts: Product[],
  counts: SyncCounts,
): Promise<void> {
  const existingArticles = new Set(
    uspacyProducts.map((product) => product.article).filter(Boolean),
  );
  const unmatchedPosts = olxPosts.filter((post) => {
    return !hasMatchingUspacyProduct(post, existingArticles);
  });
  const enrichedPosts = await OlxService.enrichPosts(
    accessToken,
    unmatchedPosts,
  );

  for (const post of enrichedPosts) {
    const article = post.externalId || post.id.toString();
    if (hasMatchingUspacyProduct(post, existingArticles)) continue;

    if (!ProductCategoryMapper.hasUspacyMapping(post.categoryId)) {
      Logger.warn("Skipping OLX post with unmapped Uspacy category", {
        advertId: post.id,
        categoryId: post.categoryId,
        article,
      });
      counts.skipped++;
      continue;
    }

    const createdProduct = await UspacyService.createProduct({
      payload: OlxPostMapper.toDomain(post),
    });
    await OlxSyncStateService.saveImportedProductSyncAt(
      article,
      getProductSyncTimestamp(createdProduct) ?? new Date(),
    );
    existingArticles.add(article);
    counts.imported++;
  }
}

function hasMatchingUspacyProduct(
  post: OlxAdvert,
  articles: Set<string>,
): boolean {
  return (
    articles.has(post.id.toString()) ||
    (post.externalId != null && articles.has(post.externalId))
  );
}

function indexOlxPostsByArticle(posts: OlxAdvert[]): Map<string, OlxAdvert> {
  const postsByArticle = new Map<string, OlxAdvert>();
  for (const post of posts) {
    postsByArticle.set(post.id.toString(), post);
    if (post.externalId) postsByArticle.set(post.externalId, post);
  }
  return postsByArticle;
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

  let importedProductSyncAt =
    await OlxSyncStateService.getImportedProductSyncAt(product.article);
  if (
    !importedProductSyncAt &&
    matchingPost.externalId == null &&
    matchingPost.id.toString() === product.article
  ) {
    importedProductSyncAt = getProductSyncTimestamp(product) ?? syncCutoff;
    await OlxSyncStateService.saveImportedProductSyncAt(
      product.article,
      importedProductSyncAt,
    );
    Logger.info("Initialized sync baseline for OLX-imported product", {
      article: product.article,
      advertId: matchingPost.id,
    });
  }

  const updateCutoff = importedProductSyncAt ?? syncCutoff;
  if (wasUpdatedAfter(product, updateCutoff)) {
    const updatedPost = await updateOlxPost(accessToken, product, matchingPost);
    if (!updatedPost) {
      counts.skipped++;
      await synchronizePostStatus(accessToken, product, matchingPost, counts);
      return;
    }
    postsByArticle.set(product.article, updatedPost);
    if (importedProductSyncAt) {
      await OlxSyncStateService.saveImportedProductSyncAt(
        product.article,
        getProductSyncTimestamp(product) ?? new Date(),
      );
    }
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

function getProductSyncTimestamp(product: Product): Date | null {
  if (!product.updatedAt) return null;

  const timestamp = new Date(product.updatedAt);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
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
  const contact = getOlxContact();
  const location = await getOlxLocationFromComment(accessToken, product);
  if (!location) return null;

  const images = await createWatermarkedImageUrls(product);
  const payload = UspacyProductToOlxMapper.toCreateRequest(
    product,
    images,
    location,
    contact,
  );

  return OlxService.createPost({ accessToken, payload });
}

async function updateOlxPost(
  accessToken: string,
  product: Product,
  matchingPost: OlxAdvert,
): Promise<OlxAdvert | null> {
  if (!matchingPost.contact) {
    Logger.warn("Skipping OLX update because advert has no contact details", {
      advertId: matchingPost.id,
      article: product.article,
    });
    return null;
  }

  const location = await getOlxLocationFromComment(
    accessToken,
    product,
    matchingPost.location,
  );
  if (!location) return null;

  const images = await createWatermarkedImageUrls(product);
  const mappedPayload = UspacyProductToOlxMapper.toCreateRequest(
    product,
    images,
    location,
    matchingPost.contact,
    matchingPost.categoryId,
    matchingPost.attributes,
  );
  const payload = {
    ...mappedPayload,
    attributes: mappedPayload.attributes ?? [],
  };

  return OlxService.updatePost({
    accessToken,
    advertId: matchingPost.id.toString(),
    payload,
  });
}

function getOlxContact(): NonNullable<CreateOlxAdvertRequestDto["contact"]> {
  const name = process.env.OLX_CONTACT_NAME?.trim();
  if (!name) {
    throw new Error("Missing required environment variable OLX_CONTACT_NAME");
  }

  const phone = process.env.OLX_CONTACT_PHONE?.trim();
  return {
    name,
    ...(phone ? { phone } : {}),
  };
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
  existingLocation?: OlxAdvert["location"],
): Promise<CreateOlxAdvertRequestDto["location"] | null> {
  const parsedLocation = CommentBuilder.parseLocationFromComment(
    product.comment,
  );
  const latitudeValue = parsedLocation?.latitude;
  const longitudeValue = parsedLocation?.longitude;
  const latitude =
    latitudeValue == null ? Number.NaN : Number(latitudeValue);
  const longitude =
    longitudeValue == null ? Number.NaN : Number(longitudeValue);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    if (existingLocation?.cityId != null) {
      return {
        cityId: existingLocation.cityId,
        ...(existingLocation.districtId != null
          ? { districtId: existingLocation.districtId }
          : {}),
        ...(existingLocation.latitude != null &&
        Number.isFinite(Number(existingLocation.latitude))
          ? { latitude: Number(existingLocation.latitude) }
          : {}),
        ...(existingLocation.longitude != null &&
        Number.isFinite(Number(existingLocation.longitude))
          ? { longitude: Number(existingLocation.longitude) }
          : {}),
      };
    }

    Logger.warn("Skipping product with no valid coordinates in its comment", {
      productId: product.id,
      article: product.article,
      latitude: latitudeValue ?? null,
      longitude: longitudeValue ?? null,
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
