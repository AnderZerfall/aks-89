export type OlxThreadRequestDto = {
  advert_id: number;
  interlocutor_id: number;
  offset: number;
  limit: number;
};

export type OlxThreadResponseDto = {
  uuid: string;
  advert_id: number;
  interlocutor_id: number;
  total_count: number;
  unread_count: number;
  created_at: Date;
  is_favourite: boolean;
}[];
