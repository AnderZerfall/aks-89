import type { VercelRequest, VercelResponse } from "@vercel/node";
import { UspacyDealStageService } from "../../src/services/uspacy-deal-stage-service.js";
import { UspacySnsService } from "../../src/services/uspacy-sns-service.js";
import { UspacySnsEnvelopeSchema } from "../../src/types/domain/uspacy-deal.js";
import { Logger } from "../../src/utils/logger.js";

const USPACY_SNS_TOPIC_ARN =
  "arn:aws:sns:eu-west-1:905329932103:Notifications-ua";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const sns = UspacySnsEnvelopeSchema.safeParse(req.body);
  if (!sns.success) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid SNS message" });
  }
  if (sns.data.TopicArn !== USPACY_SNS_TOPIC_ARN) {
    return res
      .status(403)
      .json({ success: false, error: "Unexpected SNS topic" });
  }

  try {
    if (sns.data.Type === "SubscriptionConfirmation") {
      await UspacySnsService.confirmSubscription(sns.data.SubscribeURL);
      Logger.info("Uspacy SNS subscription confirmed");
      return res.status(200).json({ success: true, subscribed: true });
    }
    if (sns.data.Type === "UnsubscribeConfirmation") {
      Logger.warn("Uspacy SNS subscription was unsubscribed");
      return res.status(200).json({ success: true, subscribed: false });
    }
    if (!(await UspacySnsService.verifyNotification(sns.data))) {
      Logger.warn("Rejected Uspacy SNS notification with invalid signature", {
        messageId: sns.data.MessageId,
      });
      return res
        .status(403)
        .json({ success: false, error: "Invalid SNS signature" });
    }

    const deactivated = await UspacyDealStageService.processNotification(
      sns.data.Message,
    );
    return deactivated === null
      ? res.status(200).json({ success: true, ignored: true })
      : res.status(200).json({ success: true, deactivated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error("Failed to process Uspacy deal stage webhook", {
      error: message.replace(/https?:\/\/\S+/g, "[redacted URL]"),
    });
    return res
      .status(500)
      .json({ success: false, error: "Webhook processing failed" });
  }
}
