import { z } from "zod";

const zodOrderItems = z.object({
  productId: z.string(),
  quantity: z.number(),
  price: z.number(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const zodShippingAddress = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  country: z.string(),
});

const zodOrderSchema = z.object({
  userId: z.string({ required_error: "user id must be required" }),
  orderItems: z.array(zodOrderItems),
  shippingAddress: zodShippingAddress,
  subtotal: z.number(),
  tax: z.number().optional(),
  shippingCharges: z.number().optional(),
  discount: z.number().optional(),
  total: z.number(),
  paymentMethod: z.string(),
  status: z.string().optional(),
});

export { zodOrderSchema };
