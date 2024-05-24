import asyncHandler from "../utils/asyncHandler.js";
import sharp, { FormatEnum } from "sharp";
import * as fs_extra from "fs-extra";

const productImageResizer = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    for (const item of req.files as Express.Multer.File[]) {
      const inputPath = item.path;
      const outputPath = await processImage(inputPath, "webp", 500, 500);
      await fs_extra.remove(inputPath);
      item.path = outputPath;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const processImage = async (
  inputPath: string,
  targetFormat: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  const outputPath = `./public/temp/${Date.now()}-${Math.round(Math.random() * 1e9)}-processed.${targetFormat}`;
  try {
    sharp.cache(false);
    const metadata = await sharp(inputPath).metadata();

    if (metadata.format !== targetFormat) {
      await sharp(inputPath)
        .resize(targetWidth, targetHeight)
        .webp({ lossless: true })
        .toFormat(targetFormat as keyof FormatEnum)
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .resize(targetWidth, targetHeight)
        .webp({ lossless: true })
        .toFile(outputPath);
    }
    return outputPath;
  } catch (error: any) {
    throw new Error(`Error processing image: ${error.message}`);
  }
};

export { productImageResizer };
