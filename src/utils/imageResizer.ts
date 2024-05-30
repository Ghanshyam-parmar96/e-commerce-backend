import sharp, { FormatEnum } from "sharp";
import * as fs_extra from "fs-extra";

const imageResizer = async (
  files: Express.Multer.File[],
  height: number = 500,
  width: number = 500
) => {
  if (!files || files.length === 0) return [];

  try {
    sharp.cache(false);
    const processImagePromise = files.map((file) =>
      processImage(file, "webp", height, width)
    );
    const processImageResult = await Promise.all(processImagePromise);
    return processImageResult;
  } catch (error) {
    throw new Error(`Error processing image: ${error}`);
  }
};

const processImage = async (
  file: Express.Multer.File,
  targetFormat: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  const outputPath = `./public/temp/${Date.now()}-${Math.round(Math.random() * 1e9)}-processed.${targetFormat}`;
  try {
    const metadata = await sharp(file.path).metadata();

    if (metadata.format !== targetFormat) {
      await sharp(file.path)
        .resize(targetWidth, targetHeight)
        .webp({ lossless: true })
        .toFormat(targetFormat as keyof FormatEnum)
        .toFile(outputPath);
    } else {
      await sharp(file.path)
        .resize(targetWidth, targetHeight)
        .webp({ lossless: true })
        .toFile(outputPath);
    }

    await fs_extra.remove(file.path);
    file.path = outputPath;
    return outputPath;
  } catch (error: any) {
    throw new Error(`Error processing image: ${error.message}`);
  }
};

export default imageResizer;
