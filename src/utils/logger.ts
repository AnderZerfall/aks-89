const SENSITIVE_KEYWORDS = [
  "password",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "client_secret",
  "authorization",
  "phone",
  "email",
  "api_key",
];

function sanitizeMessage(key: string, value: string): string {
  if (!value) return value;

  const normalizedKey = key.toLowerCase();
  const isSensitive = SENSITIVE_KEYWORDS.some((key) =>
    normalizedKey.includes(key),
  );

  if (!isSensitive) return value;

  if (typeof value === "string" && value.length > 8) {
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  }

  if (typeof value === "object") {
    return sanitizeData(value);
  }

  return "[REDACTED]";
}

function sanitizeData(data: object): string {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return JSON.stringify(data.map((item) => sanitizeData(item)));
  }

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeMessage(key, value);
  }

  return JSON.stringify(sanitized);
}

export const Logger = {
  info: (message: string, meta = {}) => {
    console.log(
      `[INFO] ${message}`,
      Object.keys(meta).length ? JSON.stringify(sanitizeData(meta)) : "",
    );
  },
  warn: (message: string, meta = {}) => {
    console.warn(
      `[WARN] ${message}`,
      Object.keys(meta).length ? JSON.stringify(sanitizeData(meta)) : "",
    );
  },
  error: (message: string, meta = {}) => {
    console.error(
      `[ERROR] ${message}`,
      Object.keys(meta).length ? JSON.stringify(sanitizeData(meta)) : "",
    );
  },
};
