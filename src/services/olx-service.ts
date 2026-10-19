import { OLX_ROUTES } from "../types/constants/routes.js";
import type { OlxAdvertsResponseDto } from "../types/dto/olx/olx-adverts.dto.js";
import type {
  OlxAuthRequestDto,
  OlxAuthResponseDto,
} from "../types/dto/olx/olx-auth.dto.js";
import {
  createRequest,
  createRequestWithAuth,
} from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

export const OlxService = {
  refreshTokens: async () => {
    const response = await createRequest<OlxAuthRequestDto, OlxAuthResponseDto>(
      OLX_ROUTES.auth.url,
      {
        method: OLX_ROUTES.auth.method,
        body: {
          grant_type: "refresh_token",
          client_id: process.env.OLX_CLIENT_ID || "client_id",
          client_secret: process.env.OLX_CLIENT_SECRET || "client_secret",
          refresh_token: process.env.OLX_REFRESH_TOKEN || "refresh_token",
        },
      },
    );

    const accessToken = response.access_token;

    if (!accessToken) {
      throw new Error(
        `Error while getting OLX token: ${JSON.stringify(response)}`,
      );
    }

    Logger.info("Access token successfully retrieved!");
    return accessToken;
  },
  getPosts: async (accessToken: string) => {
    const response = await createRequestWithAuth<{}, OlxAdvertsResponseDto>(
      OLX_ROUTES.getPosts.url,
      accessToken,
      {
        method: OLX_ROUTES.getPosts.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    if (!response.data.length) {
      Logger.info("No adverst were retrived");
    }

    const posts = response.data;

    Logger.info("Posts retrived successfully!", posts);
    return posts;
  },
};
