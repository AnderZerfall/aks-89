import { createVerify } from "node:crypto";
import { z } from "zod";
import type { UspacySnsEnvelope } from "../types/domain/uspacy-deal.js";
import {
  EmptyObjectSchema,
  NoRequestSchema,
  createRequest,
} from "../utils/create-request.js";

const SNS_CERTIFICATE_HOST = "sns.eu-west-1.amazonaws.com";
const SNS_CERTIFICATE_PATH_PATTERN =
  /^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/;
const USPACY_CONFIRMATION_PATH_PATTERN =
  /^\/webhook-relay\/v1\/aksestate\.uspacy\.ua\/confirm\/[0-9a-f-]+$/i;
const MAX_CERTIFICATE_LENGTH = 16_384;
const SIGNATURE_ALGORITHMS = {
  "1": "RSA-SHA1",
  "2": "RSA-SHA256",
} as const;

const UspacySubscriptionUrlSchema = z
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) =>
      url.protocol === "https:" &&
      url.hostname === "auth.uspacy.com" &&
      (url.port === "" || url.port === "443") &&
      !url.search &&
      !url.hash &&
      USPACY_CONFIRMATION_PATH_PATTERN.test(url.pathname),
  );

const SnsCertificateUrlSchema = z
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) =>
      url.protocol === "https:" &&
      url.hostname === SNS_CERTIFICATE_HOST &&
      !url.port &&
      !url.search &&
      !url.hash &&
      SNS_CERTIFICATE_PATH_PATTERN.test(url.pathname),
  );

const SnsCertificateSchema = z.string().max(MAX_CERTIFICATE_LENGTH);

export const UspacySnsService = {
  confirmSubscription: async (subscribeUrl: string): Promise<void> => {
    const parsedUrl = UspacySubscriptionUrlSchema.safeParse(subscribeUrl);
    if (!parsedUrl.success) {
      throw new Error("Uspacy SNS subscription URL is not allowed");
    }

    await createRequest(parsedUrl.data.toString(), {
      method: "GET",
      redirect: "error",
      requestSchema: NoRequestSchema,
      responseSchema: EmptyObjectSchema,
    });
  },

  verifyNotification: async (
    notification: Extract<UspacySnsEnvelope, { Type: "Notification" }>,
  ): Promise<boolean> => {
    const parsedCertificateUrl = SnsCertificateUrlSchema.safeParse(
      notification.SigningCertURL,
    );
    if (!parsedCertificateUrl.success) return false;

    const response = await fetch(parsedCertificateUrl.data, {
      method: "GET",
      redirect: "error",
    });
    if (!response.ok) return false;

    const parsedCertificate = SnsCertificateSchema.safeParse(
      await response.text(),
    );
    if (!parsedCertificate.success) return false;

    const verifier = createVerify(
      SIGNATURE_ALGORITHMS[notification.SignatureVersion],
    );
    for (const [key, value] of getSignedFields(notification)) {
      verifier.update(`${key}\n${value}\n`);
    }
    return verifier.verify(
      parsedCertificate.data,
      notification.Signature,
      "base64",
    );
  },
};

function getSignedFields(
  notification: Extract<UspacySnsEnvelope, { Type: "Notification" }>,
): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ["Message", notification.Message],
    ["MessageId", notification.MessageId],
  ];
  if (notification.Subject) fields.push(["Subject", notification.Subject]);
  fields.push(
    ["Timestamp", notification.Timestamp],
    ["TopicArn", notification.TopicArn],
    ["Type", notification.Type],
  );
  return fields;
}
