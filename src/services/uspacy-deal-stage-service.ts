import { OlxService } from "./olx-service.js";
import { UspacyService } from "./uspacy-service.js";
import { UspacyDealStageNotificationSchema } from "../types/domain/uspacy-deal.js";
import { Logger } from "../utils/logger.js";

export const UspacyDealStageService = {
  processNotification: async (message: string): Promise<number | null> => {
    const parsed = UspacyDealStageNotificationSchema.safeParse(
      JSON.parse(message),
    );
    if (!parsed.success) {
      Logger.warn("Ignoring unsupported Uspacy SNS notification", {
        issues: parsed.error.issues.map(({ path, code }) => ({
          path: path.join("."),
          code,
        })),
      });
      return null;
    }

    const { data } = parsed.data;
    const { entity } = data;
    const successfulStageId = process.env.USPACY_SUCCESS_DEAL_STAGE_ID?.trim();
    if (!successfulStageId) {
      throw new Error("Missing USPACY_SUCCESS_DEAL_STAGE_ID");
    }
    if (
      !["update", "update_stage"].includes(data.action) ||
      entity.new_kanban_stage_id == null ||
      String(entity.new_kanban_stage_id) !== successfulStageId ||
      String(entity.old_kanban_stage_id) === successfulStageId
    ) {
      return 0;
    }

    const dealId = String(entity.id);
    const deal = await UspacyService.getDeal(dealId);
    if (String(deal.entity.kanbanStageId) !== successfulStageId) {
      Logger.info("Deal is no longer in the successful stage", { dealId });
      return 0;
    }

    const { listProducts } = await UspacyService.getDealProducts(dealId);
    if (!listProducts.length) {
      Logger.info("Successful deal has no linked products", { dealId });
      return 0;
    }

    const accessToken = await OlxService.refreshTokens();
    let deactivated = 0;
    for (const { product } of listProducts) {
      const advertId = product.article.trim();
      if (!/^\d+$/.test(advertId)) {
        Logger.warn("Skipping linked product without a numeric OLX article", {
          productId: product.id,
        });
        continue;
      }

      await OlxService.setPostStatus({
        accessToken,
        advertId,
        command: "deactivate",
      });
      await UspacyService.setProductInactive({
        productId: String(product.id),
      });
      deactivated++;
    }
    return deactivated;
  },
};
