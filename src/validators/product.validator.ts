import { z } from "zod";

const zodProductSchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .trim()
    .min(5, { message: "title must be at least 5 characters long" }),
  highlight: z.string({ required_error: "highlight's are required" }).array(),
  price: z
    .number({ required_error: "price is required" })
    .positive({ message: "Price must be a number and greater than 0" }),
  discountedPrice: z
    .number()
    .positive({
      message: "discountedPrice must be a number and greater than 0",
    })
    .optional(),
  images: z.string({ required_error: "Product image's are required" }).array(),
  rating: z.number().positive().optional(),
  ratingCount: z.number().positive().optional(),
  stock: z
    .number({ required_error: "stock is required" })
    .min(1, { message: "minimum 1 quantity is required" }),

  brand: z
    .string({ required_error: "category is required" })
    .trim()
    .min(3, { message: "category must be at least 3 characters long" }),
  category: z
    .string({ required_error: "category is required" })
    .trim()
    .min(3, { message: "category must be at least 3 characters long" }),
});

export { zodProductSchema };
