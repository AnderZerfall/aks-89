import { Placeholder } from "../types/constants/product.js";
import { OLX_ROUTES } from "../types/constants/routes.js";
import { OlxAdvertCategorySchema } from "../types/dto/olx/olx-advert-attribute.js";
import type {
  CreateOlxAdvertRequestDto,
  OlxStatusActionRequestDto,
  UpdateOlxAdvertRequestDto,
} from "../types/dto/olx/olx-adverts.dto.js";
import {
  CreateOlxAdvertRequestSchema,
  CreateOlxAdvertResponseSchema,
  OlxAdvertsResponseSchema,
  OlxStatusActionRequestSchema,
  UpdateOlxAdvertRequestSchema,
  UpdateOlxAdvertResponseSchema,
} from "../types/dto/olx/olx-adverts.dto.js";
import type {
  OlxAdvert,
  OlxEnrichedAdvert,
} from "../types/dto/olx/olx-adverts.dto.js";
import {
  OlxAuthRequestSchema,
  OlxAuthResponseSchema,
} from "../types/dto/olx/olx-auth.dto.js";
import type { OlxRegionDto } from "../types/dto/olx/olx-location.dto.js";
import {
  OlxCitySchema,
  OlxDistrictSchema,
  OlxLocationLookupResponseSchema,
  OlxRegionSchema,
  OlxRegionResponseSchema,
} from "../types/dto/olx/olx-location.dto.js";
import {
  createRequest,
  createRequestWithAuth,
  EmptyObjectSchema,
  NoRequestSchema,
  UnknownObjectSchema,
} from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

export const OlxService = {
  refreshTokens: async () => {
    const response = await createRequest(OLX_ROUTES.auth.url, {
      method: OLX_ROUTES.auth.method,
      requestSchema: OlxAuthRequestSchema,
      responseSchema: OlxAuthResponseSchema,
      body: {
        grantType: "refresh_token",
        clientId: process.env.OLX_CLIENT_ID || "client_id",
        clientSecret: process.env.OLX_CLIENT_SECRET || "client_secret",
        refreshToken: process.env.OLX_REFRESH_TOKEN || "refresh_token",
      },
    });

    const accessToken = response.accessToken;

    if (!accessToken) {
      throw new Error(
        `Error while getting OLX token: ${JSON.stringify(response)}`,
      );
    }

    Logger.info("Access token successfully retrieved!");
    return accessToken;
  },
  getPosts: async (accessToken: string) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getPosts.url,
      accessToken,
      {
        method: OLX_ROUTES.getPosts.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxAdvertsResponseSchema,
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
  createPost: async ({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: CreateOlxAdvertRequestDto;
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.createPost.url,
      accessToken,
      {
        method: OLX_ROUTES.createPost.method,
        requestSchema: CreateOlxAdvertRequestSchema,
        responseSchema: CreateOlxAdvertResponseSchema,
        headers: {
          ["Version"]: "2.0",
        },
        body: payload,
      },
    );

    const createdPost = response.data;

    Logger.info("Post was successfully created!", createdPost);
    return createdPost;
  },
  updatePost: async ({
    accessToken,
    advertId,
    payload,
  }: {
    accessToken: string;
    advertId: string;
    payload: UpdateOlxAdvertRequestDto;
  }) => {
    Logger.info("Updating OLX advert", {
      advertId,
      method: OLX_ROUTES.updatePost.method,
      apiVersion: "2.0",
    });

    const response = await createRequestWithAuth(
      OLX_ROUTES.updatePost.url(advertId),
      accessToken,
      {
        method: OLX_ROUTES.updatePost.method,
        requestSchema: UpdateOlxAdvertRequestSchema,
        responseSchema: UpdateOlxAdvertResponseSchema,
        headers: {
          ["Version"]: "2.0",
        },
        body: payload,
      },
    );

    const updatedPost = response.data;

    Logger.info("Post was successfully updated!", updatedPost);
    return updatedPost;
  },
  setPostStatus: async ({
    accessToken,
    advertId,
    command,
  }: {
    accessToken: string;
    advertId: string;
    command: OlxStatusActionRequestDto["command"];
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.takeActionOnPost.url(advertId),
      accessToken,
      {
        method: OLX_ROUTES.takeActionOnPost.method,
        requestSchema: OlxStatusActionRequestSchema,
        responseSchema: EmptyObjectSchema,
        headers: {
          ["Version"]: "2.0",
        },
        body: { command, isSuccess: true },
      },
    );

    Logger.info(`Post status command "${command}" was sent`, advertId);
    return response;
  },
  getCategory: async ({
    accessToken,
    categortId,
  }: {
    accessToken: string;
    categortId: string;
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getCategory.url(categortId),
      accessToken,
      {
        method: OLX_ROUTES.getCategory.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxAdvertCategorySchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("Category retrived successfully!", response);
    return response;
  },
  getCategories: async ({ accessToken }: { accessToken: string }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getCategories.url,
      accessToken,
      {
        method: OLX_ROUTES.getCategories.method,
        requestSchema: NoRequestSchema,
        responseSchema: UnknownObjectSchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("Category retrived successfully!", response);
    return response;
  },
  getRegion: async ({
    accessToken,
    regionId,
  }: {
    accessToken: string;
    regionId: string;
  }): Promise<OlxRegionDto> => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getRegion.url(regionId),
      accessToken,
      {
        method: OLX_ROUTES.getRegion.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxRegionResponseSchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    const region = OlxRegionSchema.parse(
      "data" in response ? response.data : response,
    );
    Logger.info("region retrieved successfully!", { region });
    return region;
  },
  getCity: async ({
    accessToken,
    cityId,
  }: {
    accessToken: string;
    cityId: string;
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getCity.url(cityId),
      accessToken,
      {
        method: OLX_ROUTES.getCity.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxCitySchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("city retrived successfully!", response);
    return response;
  },
  getDistrict: async ({
    accessToken,
    districtId,
  }: {
    accessToken: string;
    districtId: string;
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getDistrict.url(districtId),
      accessToken,
      {
        method: OLX_ROUTES.getDistrict.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxDistrictSchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("district retrived successfully!", response);
    return response;
  },
  getLocations: async ({
    accessToken,
    latitude,
    longitude,
  }: {
    accessToken: string;
    latitude: string;
    longitude: string;
  }) => {
    const response = await createRequestWithAuth(
      OLX_ROUTES.getLocations.url(latitude, longitude),
      accessToken,
      {
        method: OLX_ROUTES.getLocations.method,
        requestSchema: NoRequestSchema,
        responseSchema: OlxLocationLookupResponseSchema,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("location retrived successfully!", response);
    return response;
  },
  getLocationByCords: async (
    accessToken: string,
    latitude: string,
    longitude: string,
  ) => {
    const locData = await OlxService.getLocations({
      accessToken,
      latitude,
      longitude,
    });

    const location = locData.data[0];
    if (!location) {
      return {
        cityName: Placeholder.NotFound,
        districtName: Placeholder.NotFound,
        regionName: Placeholder.NotFound,
      };
    }

    const city = location.city;
    const district = location.district;

    let cityName: string = Placeholder.NotFound;
    let regionName: string = Placeholder.NotFound;

    if (city) {
      cityName = city.name;
      const regionData = await OlxService.getRegion({
        accessToken,
        regionId: city.regionId.toString(),
      });
      regionName = regionData?.name || Placeholder.NotFound;
    }

    const districtName =
      district?.name ||
      city?.municipality ||
      city?.county ||
      Placeholder.NotFound;
    return { cityName, districtName, regionName };
  },
  getLocationByCity: async (accessToken: string, cityId: number) => {
    const cityData = await OlxService.getCity({
      accessToken,
      cityId: cityId.toString(),
    });

    const regionData = await OlxService.getRegion({
      accessToken,
      regionId: cityData.regionId.toString(),
    });

    return {
      cityName: cityData.name,
      regionName: regionData?.name || Placeholder.NotFound,
    };
  },

  enrichPosts: async (
    accessToken: string,
    posts: OlxAdvert[],
  ): Promise<OlxEnrichedAdvert[]> => {
    return Promise.all(
      posts.map(async (post) => {
        let cityName: string = Placeholder.NotFound;
        let districtName: string = Placeholder.NotFound;
        let regionName: string = Placeholder.NotFound;

        try {
          if (
            post.location?.latitude != null &&
            post.location?.longitude != null
          ) {
            const result = await OlxService.getLocationByCords(
              accessToken,
              post.location.latitude,
              post.location.longitude,
            );
            cityName = result.cityName;
            districtName = result.districtName;
            regionName = result.regionName;
          } else if (post.location?.cityId != null) {
            const result = await OlxService.getLocationByCity(
              accessToken,
              post.location.cityId,
            );
            cityName = result.cityName;
            regionName = result.regionName;
          }

          if (
            post.location?.districtId != null &&
            districtName === Placeholder.NotFound
          ) {
            const districtData = await OlxService.getDistrict({
              accessToken,
              districtId: post.location.districtId.toString(),
            });
            districtName = districtData?.name || Placeholder.NotFound;
          }
        } catch (error) {
          Logger.error(
            `[Enricher] Failed to fetch location details for post ${post.id}:`,
            { error: error instanceof Error ? error.message : String(error) },
          );
        }

        return {
          ...post,
          enrichedLocation: {
            city: cityName,
            district: districtName,
            region: regionName,
            address: Placeholder.NotFound,
          },
        };
      }),
    );
  },
};
