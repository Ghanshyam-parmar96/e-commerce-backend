import mongoose from "mongoose";
import { ICoupon } from "../types/product.type.js";

const couponSchema = new mongoose.Schema<ICoupon>({
  code: {
    type: String,
    unique: true,
    uppercase: true,
    required: [true, "coupon code is required"],
  },
  discount: {
    type: Number,
    required: [true, "discount is required"],
    min: [1, "discount must be greater than 0"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
