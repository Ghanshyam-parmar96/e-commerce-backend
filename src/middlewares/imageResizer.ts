import asyncHandler from "../utils/asyncHandler.js";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const productImageResizer = asyncHandler(async (req, res, next) => {
  if (!req.files) return next();

  const files = req.files as Express.Multer.File[]; // Type assertion for req.files

  await Promise.all(
    files.map(async (file) => {
      const newFileName = `${path.parse(file.path).name}.webp`;
      const newPath = path.join(path.dirname(file.path), newFileName);

      try {
        await sharp(file.path)
          .resize(500, 500, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255 },
          })
          .toFormat("webp")
          .webp({ lossless: true })
          .toFile(newPath);

        // Remove the original file
        await fs.unlink(file.path);

        // Update the file path in the req.files array
        file.path = newPath;
        file.filename = newFileName; // Update the filename property if needed
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
      }
    })
  );

  next();
});

export { productImageResizer };
