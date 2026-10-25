export type OlxLocationDto = {
  city_id: number;
  district_id: number;
  latitude: number;
  longitude: number;
};

export type OlxRegionResponseDto = {
  id: number;
  name: string;
};

export type OlxCityResponseDto = {
  id: number;
  region_id: number;
  name: string;
  county: string;
  municipality: string;
  latitude: number;
  longitude: number;
};


export type OlxDistrictResponseDto = {
  id: number;
  city_id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export type OlxLocationResponseDto = {
  city: OlxCityResponseDto
  district: OlxDistrictResponseDto
}[];