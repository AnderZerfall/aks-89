import { OlxPostMapper } from "../../src/mappers/olx-post-mapper.js";
import { OlxService } from "../../src/services/olx-service.js";
import { UspacyService } from "../../src/services/uspacy-service.js";
import { createHandler } from "../../src/utils/create-handler.js";
import { Logger } from "../../src/utils/logger.js";

const handler = createHandler(async () => {
  const accessToken = await OlxService.refreshTokens();
  const posts = await OlxService.getPosts(accessToken);
  const enrichedPosts = await OlxService.enrichPosts(accessToken, posts);
  const products = enrichedPosts.map(OlxPostMapper.toDomain).filter(Boolean);
  
  const response = await Promise.all(
    products.map(async (product) => {
      const existingProduct = await UspacyService.getProduct(product.article);

      if (existingProduct) {
        // Already exists: Ignore inbound changes. Uspacy is master.
        Logger.info(`[Sync] Product with article "${product.article}" already exists in Uspacy. Skipping creation.`);
        return null;
      }

      Logger.info(`[Sync] Creating new product in Uspacy for article "${product.article}".`);
      return UspacyService.createProduct({
        payload: product,
      });
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
