export const DB_NAME = "e-commerce";
export const Product_available_size = ["ram", "ml", "gram"];

export const cookieOptions: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  expires?: Date;
} = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
};
