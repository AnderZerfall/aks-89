import { createVerify } from "node:crypto";
import type { UspacySnsEnvelope } from "../types/domain/uspacy-deal.js";
import {
  EmptyObjectSchema,
  NoRequestSchema,
  createRequest,
} from "../utils/create-request.js";

const SNS_CERTIFICATE_HOST = "sns.eu-west-1.amazonaws.com";

export const UspacySnsService = {
  confirmSubscription: async (subscribeUrl: string): Promise<void> => {
    const url = new URL(subscribeUrl);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "auth.uspacy.com" ||
      (url.port !== "" && url.port !== "443") ||
      url.search ||
      url.hash ||
      !/^\/webhook-relay\/v1\/aksestate\.uspacy\.ua\/confirm\/[0-9a-f-]+$/i.test(
        url.pathname,
      )
    ) {
      throw new Error("Uspacy SNS subscription URL is not allowed");
    }

    await createRequest(url.toString(), {
      method: "GET",
      redirect: "error",
      requestSchema: NoRequestSchema,
      responseSchema: EmptyObjectSchema,
    });
  },

  verifyNotification: async (
    notification: Extract<UspacySnsEnvelope, { Type: "Notification" }>,
  ): Promise<boolean> => {
    const certificateUrl = new URL(notification.SigningCertURL);
    if (
      certificateUrl.protocol !== "https:" ||
      certificateUrl.hostname !== SNS_CERTIFICATE_HOST ||
      certificateUrl.port ||
      certificateUrl.search ||
      certificateUrl.hash ||
      !/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(
        certificateUrl.pathname,
      )
    ) {
      return false;
    }

    const response = await fetch(certificateUrl, {
      method: "GET",
      redirect: "error",
    });
    if (!response.ok) return false;

    const certificate = await response.text();
    if (certificate.length > 16_384) return false;

    const verifier = createVerify(
      notification.SignatureVersion === "1" ? "RSA-SHA1" : "RSA-SHA256",
    );
    for (const [key, value] of getSignedFields(notification)) {
      verifier.update(`${key}\n${value}\n`);
    }
    return verifier.verify(certificate, notification.Signature, "base64");
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
