import type { OlxAdvertiser, OlxAdvertStatus } from "../../constants/olx.js";
import type { OlxAdvertAttribute } from "./olx-advert-attribute.js";
import type { OlxContactDto } from "./olx-contact.dto.js";
import type { OlxLocationDto } from "./olx-location.dto.js";
import type { OlxPriceDto } from "./olx-price.dto.js";

export type OlxPhoto = {
  url: string;
}

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
  attributes: OlxAdvertAttribute[]
  price: OlxPriceDto;
  images: OlxPhoto[];
};

export type OlxEnrichedAdvert = OlxAdvert & {
  enrichedLocation: {
    city: string;
    district: string;
    region: string;
    address: string;
  }
}

export type OlxAdvertsResponseDto = {
  data: OlxAdvert[];
};

export type CreateOlxAdvertRequestDto = {
  title: string;                 
  description: string;           
  category_id: number;           
  advertiser_type: OlxAdvertiser; 
  location: OlxLocationDto;
  price: OlxPriceDto;
  images?: OlxPhoto[];
  attributes?: OlxAdvertAttribute[];
  contact?: OlxContactDto
  external_id?: string;
  external_url?: string;
}

export type CreateOlxAdvertResponseData =  {
  id: number;                    
  title: string;
  description: string;
  category_id: number;
  status: OlxAdvertStatus;
  url: string;                   
  created_at: string;            
  activated_at?: string;
  valid_to?: string;             
  location: OlxLocationDto;
  price: OlxPriceDto;
  photos: OlxPhoto[];
  attributes?: OlxAdvertAttribute[];
  external_id?: string;
}

export type  CreateOlxAdvertResponseDto = {
  data: CreateOlxAdvertResponseData;
}

export type  UpdateOlxAdvertRequestDto = {
  title?: string;                
  description?: string;          
  category_id?: number;          
  advertiser_type?: OlxAdvertiser;
  location?: OlxLocationDto;
  price?: OlxPriceDto;
  photos?: OlxPhoto[];        
  attributes?: OlxAdvertAttribute[]; 
  contact?: OlxContactDto;
  external_id?: string;
  external_url?: string;
}

export type UpdateOlxAdvertResponseDto = {
  data: CreateOlxAdvertResponseData; 
}

export type DeactivateRequestDto = {
  command: "deactivate";                
  is_success: boolean;
}
