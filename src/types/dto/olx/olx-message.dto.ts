import type { OlxMessage } from "../../constants/olx.js";

export type OlxAttachments = {
  name: string;
  url: string;
};

export type OlxMessageResponseDto = {
  uuid: string;
  thread_uuid: string;
  created_at: Date;
  type: OlxMessage;
  text: string;
  attachments: OlxAttachments[] | null;
  is_read: boolean;
  csv: OlxAttachments[] | null;
}[];
