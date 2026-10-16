import { OlxService } from "../../src/services/olx-service.js";
import { createHandler } from "../../src/utils/create-handler.js";

const handler = createHandler(async () => {
  const accessToken = await OlxService.refreshTokens();
  const posts = await OlxService.getPosts(accessToken);

  // TODO:
  // 1. Map adverts to Uspacy Products
  // 2. get uspacy products
  // 3. compare adverts and uspacy products by external id, town, country, address
  // 4. remove duplicates
  // 5. log new adverts
  // 6. save then to uspacy
});

export default handler;
