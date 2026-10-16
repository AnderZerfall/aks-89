import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Logger } from "./logger.js";

export type VercelHandlerCallback = () => Promise<any> | any;

export type VercelCronHandler = (
  req: VercelRequest,
  res: VercelResponse,
) => Promise<VercelResponse | void>;

export function createHandler(
  callback: VercelHandlerCallback,
): VercelCronHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const startTime = Date.now();
      Logger.info(`[Cron] Started at ${new Date().toISOString()}`);

      const authHeader = req.headers.authorization;

      if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
      ) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await callback();

      const duration = Date.now() - startTime;
      Logger.info(`[Cron] Successfully finished in ${duration}ms`);

      return res.status(200).json({
        success: true,
        durationMs: duration,
        data: result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error("[Cron] Failed", errorMessage);
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  };
}
