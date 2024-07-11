import { v2 as cloudinary } from "cloudinary";
import fs_extra from "fs-extra";
import { ApiError } from "./apiError.js";

export const uploadOnCloudinary = async (
  localFilePath: string,
  folder: string = "e-commerce/product_images"
) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder: folder,
    });
    await fs_extra.remove(localFilePath);
    return response.secure_url;
  } catch (error) {
    console.log("error", error);
    await fs_extra.remove(localFilePath);
  }
};

export const deleteOnCloudinary = async (localFilePath: string[]) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const defaultImage =
    "https://res.cloudinary.com/dmrboyo0j/image/upload/v1717587362/e-commerce/product_images/vsuyokcgzsw332zz4483.webp";

  if (!localFilePath) return null;
  if (
    defaultImage === localFilePath[0] ||
    !defaultImage.startsWith("https://res.cloudinary.com")
  ) {
    return null;
  }

  try {
    const response = await cloudinary.api.delete_resources(
      localFilePath.map((url) =>
        url.split("/").slice(-3).join("/").slice(0, -5)
      )
    );
    return response;
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while deleting image from server"
    );
  }
};
