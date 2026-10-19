export type RequestOptions<TRequestType> = {
  method: string;
  body?: TRequestType;
  headers?: Record<string, string>;
};

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

export async function createRequest<
  TRequestType extends Record<string, any>,
  TResponseType extends Record<string, any> | null,
>(url: string, options: RequestOptions<TRequestType>): Promise<TResponseType> {
  const response = await fetch(url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : null,
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

  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return {} as unknown as TResponseType;
}

export async function createRequestWithAuth<
  TRequestType extends Record<string, any>,
  TResponseType extends Record<string, any> | null,
>(
  url: string,
  token: string,
  options: RequestOptions<TRequestType>,
): Promise<TResponseType> {
  return createRequest(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
