export type OlxLocationDto = {
  city_id: number;
  district_id: number;
  latitude: number;
  longitude: number;
};

export type OlxRegionDto = {
  id: number;
  name: string;
};

export type OlxRegionResponseDto =
  | OlxRegionDto
  | {
      data: OlxRegionDto;
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
  data: {
    city: OlxCityResponseDto;
    district: OlxDistrictResponseDto | null;
  }[];
};