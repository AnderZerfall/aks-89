import type { OlxAdvertiser, OlxAdvertStatus } from "../../constants/olx.js";
import type { OlxContactDto } from "./olx-contact.dto.js";
import type { OlxLocationDto } from "./olx-location.dto.js";
import type { OlxPriceDto } from "./olx-price.dto.js";

export type OlxAdvert = {
  id: number;
  status: OlxAdvertStatus;
  url: string;
  created_at: Date;
  activated_at: Date;
  valid_to: string;
  title: string;
  description: string;
  category_id: number;
  advertiser_type: OlxAdvertiser;
  external_id: string;
  external_url: string;
  contact: OlxContactDto;
  location: OlxLocationDto;
  price: OlxPriceDto;
  images: {
    url: string;
  }[];
};
export type OlxAdvertsResponseDto = {
  data: OlxAdvert[];
};
