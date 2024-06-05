import { z } from "zod";
import isValidMongodbId from "../utils/isValidMongodbId.js";

const productSize = z.object({
  name: z.string({ required_error: "size name is required" }),
  title: z.string({ required_error: "title title is required" }),
  price: z.number({ required_error: "size price is required" }).positive(),
  MRP: z
    .number({ required_error: "size discounted price is required" })
    .positive()
    .optional(),
  discountPercent: z
    .number({ required_error: "size discountPercent is required" })
    .positive()
    .optional(),
  stock: z.number({ required_error: "size stock is required" }).positive(),
});

const productColor = z.object({
  productId: z.string({ required_error: "product id is required" }),
  name: z.string({ required_error: "product name is required" }),
  image: z.string({ required_error: "product image is required" }),
});

const zodProductSchema = z.object({
  uniqueId: z
    .string()
    .transform((id) => isValidMongodbId(id || ""))
    .optional(),
  title: z
    .string()
    .trim()
    .min(10, { message: "title must be at least 10 characters long" })
    .optional(),
  highlight: z.string({ required_error: "highlight's are required" }).array(),
  image: z.string().array().optional(),
  price: z.number().positive().optional(),
  MRP: z.number().positive().optional(),
  rating: z.number().lte(5).gte(0).optional(),
  ratingCount: z.number().nonnegative().optional(),
  stock: z.number().positive().optional(),
  brand: z
    .string({ required_error: "category is required" })
    .trim()
    .min(3, { message: "category must be at least 3 characters long" }),
  category: z
    .string({ required_error: "category is required" })
    .trim()
    .min(3, { message: "category must be at least 3 characters long" }),
  colorName: z.string().optional(),
  moreDetails: z.string().optional(),
  size: z.array(productSize).optional(),
  color: z.array(productColor).optional(),
});

const zodUpdateProductSchema = zodProductSchema.partial();

export { zodProductSchema, zodUpdateProductSchema };
