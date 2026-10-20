export const OLX_ROUTES = {
  auth: {
    method: "POST",
    url: "https://www.olx.ua/api/open/oauth/token",
  },
  getPosts: {
    method: "GET",
    url: "https://www.olx.ua/api/partner/adverts",
  },
  createPost: {
    method: "POST",
    url: "https://www.olx.ua/api/partner/adverts",
  },
  updatePost: {
    method: "POST",
    url: (advertId: string) =>
      `https://www.olx.ua/api/partner/adverts/${advertId}`,
  },
  takeActionOnPost: {
    method: "POST",
    url: (advertId: string) =>
      `https://www.olx.ua/api/partner/adverts/${advertId}/commands`,
  },
  getThreads: {
    method: "GET",
    url: "https://www.olx.ua/api/partner/threads",
  },
  getMessages: {
    method: "GET",
    url: (threadId: string) =>
      `https://www.olx.ua/api/partner/threads/${threadId}/messages`,
  },
  addLogo: {
    method: "POST",
    url: (advertId: string) =>
      `https://www.olx.ua/api/partner/adverts/${advertId}/logos`,
  },
  getLogos: {
    method: "GET",
    url: (advertId: string) =>
      `https://www.olx.ua/api/partner/adverts/${advertId}/logos`,
  },
  getCategory: {
    method: "GET",
    url: (categoryId: string) =>
      `https://www.olx.ua/api/partner/categories/${categoryId}`,
  },
  getRegion: {
    method: "GET",
    url: (regionId: string) =>
      `https://www.olx.ua/api/partner/regions/${regionId}`,
  },
  getCity: {
    method: "GET",
    url: (cityId: string) => `https://www.olx.ua/api/partner/cities/${cityId}`,
  },
  getDistrict: {
    method: "GET",
    url: (districtId: string) =>
      `https://www.olx.ua/api/partner/districts/${districtId}`,
  },
  getLocations: {
    method: "GET",
    url: (latitude: string, longitude: string) =>
      `https://www.olx.ua/api/partner/locations?latitude=${latitude}&longitude=${longitude}`,
  },
};

const USPACY_INCOMMING_WEBHOOK =
  "https://aksestate.uspacy.ua/company/v1/incoming_webhooks/run/aKmzP2NLdzSQsZ9hAt1K696I9nTPAQeG";

export const USPACY_ROUTES = {
  createEntity: {
    method: "POST",
    url: `${USPACY_INCOMMING_WEBHOOK}/crm/v1/entity`,
  },
  updateEntity: {
    method: "PATCH",
    url: (entityId: string) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/entity/${entityId}`,
  },
  deleteEntity: {
    method: "delete",
    url: (entityId: string) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/entity/${entityId}`,
  },
  getProduct: {
    method: "GET",
    url: (productId: string) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products/${productId}`,
  },
  listProducts: {
    method: "GET",
    url: `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products`,
  },
  createProduct: {
    method: "POST",
    url: `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products`,
  },
  bulkCreateProducts: {
    method: "POST",
    url: `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products/bulk`,
  },
  updateProduct: {
    method: "PATCH",
    url: (productId: string) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products/${productId}`,
  },
  deleteProduct: {
    method: "DELETE",
    url: (productId: string) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products/${productId}`,
  },
};
