import { OlxPostMapper } from "../../src/mappers/olx-post-mapper.js";
import { OlxService } from "../../src/services/olx-service.js";
import { UspacyService } from "../../src/services/uspacy-service.js";
import { createHandler } from "../../src/utils/create-handler.js";

const handler = createHandler(async () => {
  const accessToken = await OlxService.refreshTokens();
  const posts = await OlxService.getPosts(accessToken);
  const products = posts.map(OlxPostMapper.toDomain).filter(Boolean);
  const response = Promise.all(
    products.map((product) =>
      UspacyService.createProduct({
        payload: product,
      }),
    ),
  );
  console.log(response);

  // TODO:
  // 1. Map adverts to Uspacy Products
  // 2. get uspacy products
  // 3. compare adverts and uspacy products by external id, town, country, address
  // 4. remove duplicates
  // 5. log new adverts
  // 6. save then to uspacy
});

export default handler;
