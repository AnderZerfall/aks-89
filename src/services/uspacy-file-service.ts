import { USPACY_ROUTES } from "../types/constants/routes.js";
import type { EntityType } from "../types/domain/entity.js";
import { createRequest } from "../utils/create-request.js";
import { Logger } from "../utils/logger.js";

export const UspacyFileService = {
  uploadImage: async (imageUrl: string): Promise<string | null> => {
    try {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(
          `Failed to fetch raw image from OLX. Status: ${imageRes.status}`,
        );
      }

      const arrayBuffer = await imageRes.arrayBuffer();
      const contentType = imageRes.headers.get("content-type") || "image/jpeg";

      const urlFileName = imageUrl.split("/").pop()?.split("?")[0];
      const filename =
        urlFileName && urlFileName.includes(".")
          ? urlFileName
          : `olx_image_${Date.now()}.jpg`;

      const blob = new Blob([arrayBuffer], { type: contentType });
      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("entityType", "product");
      formData.append("entityId", "0");

      const uploadResponse = await createRequest<
        FormData,
        {
          data: {
            id: number;
            entityType: EntityType;
            entityId: number;
            uploadId: number;
            originalFilename: string;
            lastModified: number;
            size: number;
            url: string;
          };
        }
      >(USPACY_ROUTES.uploadFiles.url, {
        method: USPACY_ROUTES.uploadFiles.method,
        body: formData,
      });

      return String(uploadResponse?.data?.id) || null;
    } catch (error) {
      Logger.error(
        `[UspacyFileService] Failed to upload image ${imageUrl}:`,
        error,
      );
      return null;
    }
  },
  uploadBatchImages: async (imageUrls: string[]): Promise<string[]> => {
    if (!imageUrls || imageUrls.length === 0) return [];

    const uploadPromises = imageUrls.map((url) =>
      UspacyFileService.uploadImage(url),
    );
    const results = await Promise.all(uploadPromises);

    return results.filter((id): id is string => Boolean(id));
  },
};
