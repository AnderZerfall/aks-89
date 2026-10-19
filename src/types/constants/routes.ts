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
};

export const USPACY_ROUTES = {
  webhook:
    "https://aksestate.uspacy.ua/company/v1/incoming_webhooks/run/aKmzP2NLdzSQsZ9hAt1K696I9nTPAQeG",
};
