import { z } from "zod";

const zodAddress = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  country: z.string(),
});

export const zodUserSchema = z.object({
  fullName: z.string({ required_error: "full name is required" }),
  email: z.string({ required_error: "email is required" }).email(),
  DOB: z.string().date().optional(),
  gender: z.enum(["male", "female"]).optional(),
  password: z.string().optional(),
  address: z.array(zodAddress).optional(),
  phoneNumber: z.string().length(10).optional(),
  avatar: z.string().optional(),
  isVerified: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(),
});
// isAdmin: z.boolean().optional(),
// role: z.string().optional(),

export const zodUserUpdateSchema = zodUserSchema.partial();
