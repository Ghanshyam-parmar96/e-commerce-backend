import { z } from "zod";

const passwordStrengthSchema = z.string().superRefine((password, ctx) => {
  const length = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 8 characters long.",
    });
  } else {
    if (
      !(
        (hasUpper && hasLower && hasDigit) ||
        (hasUpper && hasLower && hasSpecial) ||
        (hasUpper && hasDigit && hasSpecial) ||
        (hasLower && hasDigit && hasSpecial)
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Password must contain at least three types of characters: uppercase, lowercase, digits, special characters.",
      });
    }
  }
});

export const zodCreateUserSchema = z.object({
  fullName: z.string({ required_error: "name is required" }),
  email: z.string({ required_error: "email is required" }).email(),
  gender: z
    .enum(["male", "female"], {
      required_error: "Gender is required",
    })
    .optional(),
  DOB: z.string().date().optional(),
  password: passwordStrengthSchema,
});

export const zodLoginUserSchema = z.object({
  email: z.string({ required_error: "email is required" }).email(),
  password: z.string({ required_error: "password is required" }),
});

export const zodGenerateNewPasswordSchema = z.object({
  resetPasswordToken: z.number().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
  newPassword: passwordStrengthSchema,
});

export const zodChangePasswordSchema = z.object({
  oldPassword: z.string({ required_error: "old password is required" }),
  newPassword: passwordStrengthSchema,
});

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
