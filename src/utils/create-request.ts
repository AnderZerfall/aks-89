import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import { z } from "zod";

export const NoRequestSchema = z.undefined();
export const EmptyObjectSchema = z.object({}).loose();
export const UnknownObjectSchema = z.record(z.string(), z.unknown());

export type RequestOptions<
  TRequestSchema extends z.ZodType,
  TResponseSchema extends z.ZodType,
> = {
  method: string;
  requestSchema: TRequestSchema;
  responseSchema: TResponseSchema;
  body?: z.input<TRequestSchema>;
  headers?: Record<string, string>;
};

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

export async function createRequest<
  TRequestSchema extends z.ZodType,
  TResponseSchema extends z.ZodType,
>(
  url: string,
  options: RequestOptions<TRequestSchema, TResponseSchema>,
): Promise<z.output<TResponseSchema>> {
  const parsedBody = options.requestSchema.parse(options.body);
  const response = await fetch(url, {
    method: options.method,
    body:
      parsedBody === undefined
        ? null
        : JSON.stringify(
            snakecaseKeys(parsedBody as Record<string, unknown>, {
              deep: true,
            }),
          ),
    headers: options.headers
      ? {
          ...DEFAULT_HEADERS,
          ...options.headers,
        }
      : DEFAULT_HEADERS,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error [${response.status}] at ${url}: ${errorBody}`);
  }

  const contentType = response.headers.get("content-type");
  const rawResponse =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : {};

  return options.responseSchema.parse(
    camelcaseKeys(rawResponse, { deep: true }),
  );
}

export async function createRequestWithAuth<
  TRequestSchema extends z.ZodType,
  TResponseSchema extends z.ZodType,
>(
  url: string,
  token: string,
  options: RequestOptions<TRequestSchema, TResponseSchema>,
): Promise<z.output<TResponseSchema>> {
  return createRequest(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
