import { OlxPostMapper } from "../../src/mappers/olx-post-mapper.js";
import { OlxService } from "../../src/services/olx-service.js";
import { UspacyService } from "../../src/services/uspacy-service.js";
import { createHandler } from "../../src/utils/create-handler.js";
import { CommentBuilder } from "../../src/utils/location-util.js";
import { Logger } from "../../src/utils/logger.js";

const handler = createHandler(async () => {
  const accessToken = await OlxService.refreshTokens();
  const posts = await OlxService.getPosts(accessToken);
  const enrichedPosts = await OlxService.enrichPosts(accessToken, posts);
  const products = enrichedPosts.map(OlxPostMapper.toDomain).filter(Boolean);

  const existingProducts = await UspacyService.getRecentProducts();
  const existingArticles = new Set(existingProducts.map((p) => p.article));
  const existingLocationSignatures = new Set(
    existingProducts
      .map((p) => {
        const parsedLoc = CommentBuilder.parseLocationFromComment(p.comment);
        return parsedLoc
          ? CommentBuilder.createLocationSignature(parsedLoc)
          : null;
      })
      .filter(Boolean),
  );

  const categories = await OlxService.getCategories({
    accessToken,
  });
  Logger.info("Categories", categories);

  // posts.forEach(async (post) => {
  //   const category = await OlxService.getCategory({
  //     accessToken,
  //     categortId: String(post.category_id),
  //   });
  //   Logger.info("Category", category);
  // });

  const response = await Promise.all(
    products.map(async (product) => {
      if (product.article && existingArticles.has(product.article)) {
        Logger.info(
          `[Sync] Product with article "${product.article}" already exists. Skipping.`,
        );
        return null;
      }

      const productLoc = CommentBuilder.parseLocationFromComment(
        product.comment,
      );
      const productLocSig = productLoc
        ? CommentBuilder.createLocationSignature(productLoc)
        : null;

      if (productLocSig && existingLocationSignatures.has(productLocSig)) {
        Logger.info(
          `[Sync] Duplicate found by location signature for article "${product.article}". Skipping.`,
        );
        return null;
      }

      Logger.info(
        `[Sync] Creating new product in Uspacy for article "${product.article}".`,
      );
      const created = await UspacyService.createProduct({ payload: product });

      if (product.article) existingArticles.add(product.article);
      if (productLocSig) existingLocationSignatures.add(productLocSig);

      return created;
    }),
  );

  return response.filter(Boolean);

  // TODO:
  // 1. Map adverts to Uspacy Products
  // 2. get uspacy products
  // 3. compare adverts and uspacy products by external id, town, country, address
  // 4. remove duplicates
  // 5. log new adverts
  // 6. save then to uspacy
});

export default handler;
