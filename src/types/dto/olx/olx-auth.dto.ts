export type OlxAuthRequestDto = {
  grant_type: "refresh_token";
  client_id: string;
  client_secret: string;
  refresh_token: string;
};

export type OlxAuthResponseDto = {
  access_token: string;
};
