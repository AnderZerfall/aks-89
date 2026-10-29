import { Placeholder } from "../types/constants/product.js";
import { OLX_ROUTES } from "../types/constants/routes.js";
import type { OlxAdvertCategory } from "../types/dto/olx/olx-advert-attribute.js";
import type {
  CreateOlxAdvertRequestDto,
  CreateOlxAdvertResponseDto,
  DeactivateRequestDto,
  OlxAdvert,
  OlxAdvertsResponseDto,
  OlxEnrichedAdvert,
  UpdateOlxAdvertRequestDto,
  UpdateOlxAdvertResponseDto,
} from "../types/dto/olx/olx-adverts.dto.js";
import type {
  OlxAuthRequestDto,
  OlxAuthResponseDto,
} from "../types/dto/olx/olx-auth.dto.js";
import type {
  OlxCityResponseDto,
  OlxDistrictResponseDto,
  OlxLocationResponseDto,
  OlxRegionResponseDto,
} from "../types/dto/olx/olx-location.dto.js";
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
  createPost: async ({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: CreateOlxAdvertRequestDto;
  }) => {
    const response = await createRequestWithAuth<
      CreateOlxAdvertRequestDto,
      CreateOlxAdvertResponseDto
    >(OLX_ROUTES.createPost.url, accessToken, {
      method: OLX_ROUTES.createPost.method,
      headers: {
        ["Version"]: "2.0",
      },
      body: payload,
    });

    if (!response.data) {
      Logger.error("Something went wrong during creation");
    }

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
    const response = await createRequestWithAuth<
      UpdateOlxAdvertRequestDto,
      UpdateOlxAdvertResponseDto
    >(OLX_ROUTES.updatePost.url(advertId), accessToken, {
      method: OLX_ROUTES.updatePost.method,
      headers: {
        ["Version"]: "2.0",
      },
      body: payload,
    });

    if (!response.data) {
      Logger.info("Something went wrong during update");
    }

    const updatedPost = response.data;

    Logger.info("Post was successfully updated!", updatedPost);
    return updatedPost;
  },
  deactivatePost: async ({
    accessToken,
    advertId,
    payload,
  }: {
    accessToken: string;
    advertId: string;
    payload: DeactivateRequestDto;
  }) => {
    const response = await createRequestWithAuth<DeactivateRequestDto, {}>(
      OLX_ROUTES.takeActionOnPost.url(advertId),
      accessToken,
      {
        method: OLX_ROUTES.takeActionOnPost.method,
        headers: {
          ["Version"]: "2.0",
        },
        body: payload,
      },
    );

    Logger.info("Post was successfully deactivated!", advertId);
    return response;
  },
  getCategory: async ({
    accessToken,
    categortId,
  }: {
    accessToken: string;
    categortId: string;
  }) => {
    const response = await createRequestWithAuth<{}, OlxAdvertCategory>(
      OLX_ROUTES.getCategory.url(categortId),
      accessToken,
      {
        method: OLX_ROUTES.getCategory.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("Category retrived successfully!", response);
    return response;
  },
  getCategories: async ({ accessToken }: { accessToken: string }) => {
    const response = await createRequestWithAuth<{}, {}>(
      OLX_ROUTES.getCategories.url,
      accessToken,
      {
        method: OLX_ROUTES.getCategories.method,
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
  }) => {
    const response = await createRequestWithAuth<{}, OlxRegionResponseDto>(
      OLX_ROUTES.getRegion.url(regionId),
      accessToken,
      {
        method: OLX_ROUTES.getRegion.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("Region retrived successfully!", response);
    return response;
  },
  getCity: async ({
    accessToken,
    cityId,
  }: {
    accessToken: string;
    cityId: string;
  }) => {
    const response = await createRequestWithAuth<{}, OlxCityResponseDto>(
      OLX_ROUTES.getCity.url(cityId),
      accessToken,
      {
        method: OLX_ROUTES.getCity.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("City retrived successfully!", response);
    return response;
  },
  getDistrict: async ({
    accessToken,
    districtId,
  }: {
    accessToken: string;
    districtId: string;
  }) => {
    const response = await createRequestWithAuth<{}, OlxDistrictResponseDto>(
      OLX_ROUTES.getDistrict.url(districtId),
      accessToken,
      {
        method: OLX_ROUTES.getDistrict.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("District retrived successfully!", response);
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
    const response = await createRequestWithAuth<{}, OlxLocationResponseDto>(
      OLX_ROUTES.getLocations.url(latitude, longitude),
      accessToken,
      {
        method: OLX_ROUTES.getLocations.method,
        headers: {
          ["Version"]: "2.0",
        },
      },
    );

    Logger.info("Location retrived successfully!", response);
    return response;
  },
  getLocationByCords: async (accessToken: string, lat: number, lon: number) => {
    const locData = await OlxService.getLocations({
      accessToken,
      latitude: lat.toString(),
      longitude: lon.toString(),
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
        regionId: city.region_id.toString(),
      });
      regionName = regionData?.name || Placeholder.NotFound;
    }

    const districtName = district?.name || Placeholder.NotFound;
    return { cityName, districtName, regionName };
  },
  getLocationByCity: async (accessToken: string, cityId: number) => {
    const cityData = await OlxService.getCity({
      accessToken,
      cityId: cityId.toString(),
    });

    if (!cityData) {
      return {
        cityName: Placeholder.NotFound,
        regionName: Placeholder.NotFound,
      };
    }

    const regionData = await OlxService.getRegion({
      accessToken,
      regionId: cityData.region_id.toString(),
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
          } else if (post.location?.city_id) {
            const result = await OlxService.getLocationByCity(
              accessToken,
              post.location.city_id,
            );
            cityName = result.cityName;
            regionName = result.regionName;
          }

          if (
            post.location?.district_id &&
            districtName === Placeholder.NotFound
          ) {
            const districtData = await OlxService.getDistrict({
              accessToken,
              districtId: post.location.district_id.toString(),
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
