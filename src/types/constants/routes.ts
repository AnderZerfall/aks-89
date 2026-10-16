export const OLX_ROUTES = {
  auth: "https://www.olx.ua/api/open/oauth/token",
  getPosts: "https://www.olx.ua/api/partner/adverts",
  getThreads: "https://www.olx.ua/api/partner/threads",
  getMessages: (threadId: string) =>
    `https://www.olx.ua/api/partner/threads/${threadId}/messages`,
};

export const USPACY_ROUTES = {
  webhook:
    "https://aksestate.uspacy.ua/company/v1/incoming_webhooks/run/aKmzP2NLdzSQsZ9hAt1K696I9nTPAQeG",
};
