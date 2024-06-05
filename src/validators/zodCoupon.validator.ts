import { z } from "zod";

export const zodCouponSchema = z.object({
  code: z.string({ required_error: "Coupon code is required" }).min(5),
  discount: z.number({ required_error: "Discount is required" }).gte(1),
});

export const zodCouponUpdate = zodCouponSchema.partial();
