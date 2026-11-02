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
    method: "PUT",
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
    url: (offset: number, limit: number) => {
      const query = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
      });
      return `https://www.olx.ua/api/partner/threads?${query}`;
    },
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
  getCategories: {
    method: "GET",
    url: "https://www.olx.ua/api/partner/categories",
  },
  getUserBusiness: {
    method: "GET",
    url: "https://www.olx.ua/api/partner/users-business/me",
  },
  getCategoryAttributes: {
    method: "GET",
    url: (categoryId: string) =>
      `https://www.olx.ua/api/partner/categories/${categoryId}/attributes`,
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
const USPACY_API_BASE_URL = new URL(USPACY_INCOMMING_WEBHOOK).origin;

export const USPACY_ROUTES = {
  signIn: {
    method: "POST",
    url: `${USPACY_API_BASE_URL}/auth/v1/auth/sign_in`,
  },
  getFiles: {
    method: "GET",
    url: (entityType: string, entityId: number) => {
      const query = new URLSearchParams({
        entityType,
        entityId: String(entityId),
      });
      return `${USPACY_API_BASE_URL}/files/v1/files?${query}`;
    },
  },
  uploadFiles: {
    method: "POST",
    url: `${USPACY_API_BASE_URL}/files/v1/files`,
  },
  searchContacts: {
    method: "GET",
    url: (phone?: string, email?: string) => {
      const query = new URLSearchParams();
      if (phone) query.set("phone", phone);
      if (email) query.set("email", email);
      return `${USPACY_API_BASE_URL}/crm/v1/entities/contacts?${query}`;
    },
  },
  createContact: {
    method: "POST",
    url: `${USPACY_API_BASE_URL}/crm/v1/entities/contacts`,
  },
  createLead: {
    method: "POST",
    url: `${USPACY_API_BASE_URL}/crm/v1/entities/leads`,
  },
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
  getDeal: {
    method: "GET",
    url: (dealId: string) => `${USPACY_API_BASE_URL}/gateway/v1/deals/${dealId}`,
  },
  getDealProducts: {
    method: "GET",
    url: (dealId: string) => {
      const query = new URLSearchParams({
        entity_type: "deals",
        entity_id: dealId,
      });
      return `${USPACY_API_BASE_URL}/crm/v1/static/entity-product-lists?${query}`;
    },
  },
  listProducts: {
    method: "GET",
    url: (page: number = 1, list: number = 20) =>
      `${USPACY_INCOMMING_WEBHOOK}/crm/v1/static/products?page=${page}&list=${list}`,
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
