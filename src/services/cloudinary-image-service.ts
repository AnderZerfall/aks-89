import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

const CloudinaryUploadResponseSchema = z.object({
  secure_url: z.string().url(),
});

const ImageUrlSchema = z.string().url();

export const CloudinaryImageService = {
  uploadWatermarkedImage: async (
    imageUrl: string,
    publicId: string,
  ): Promise<string> => {
    const source = ImageUrlSchema.parse(imageUrl);
    const sourceUrl = new URL(source);
    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
      throw new Error("Cloudinary image source must use HTTP or HTTPS");
    }

    cloudinary.config({
      cloud_name: requiredEnvironmentVariable("CLOUDINARY_CLOUD_NAME"),
      api_key: requiredEnvironmentVariable("CLOUDINARY_API_KEY"),
      api_secret: requiredEnvironmentVariable("CLOUDINARY_API_SECRET"),
    });

    const uploadResult = await cloudinary.uploader.upload(source, {
      folder: "aks-89/olx",
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
      transformation: [
        {
          overlay: {
            font_family: "Arial",
            font_size: 36,
            text: "АКС 89",
          },
          gravity: "south_east",
          x: 24,
          y: 24,
          color: "#ffffff",
          opacity: 70,
          effect: "shadow",
        },
      ],
    });

    return CloudinaryUploadResponseSchema.parse(uploadResult).secure_url;
  },
};

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
