import { Request } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ICoupon } from "../types/product.type.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Coupon } from "../models/coupon.model.js";
import isValidMongodbId from "../utils/isValidMongodbId.js";

const createCoupon = asyncHandler(
  async (req: Request<{}, {}, ICoupon>, res) => {
    const { code, discount } = req.body;

    const coupon = await Coupon.create({ code, discount });
    res
      .status(201)
      .json(new ApiResponse(201, coupon, "coupon created successfully"));
  }
);

const getCoupons = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const coupon = await Coupon.findById(id);
  res
    .status(200)
    .json(new ApiResponse(200, coupon, "coupon retrieved successfully"));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const coupon = await Coupon.findByIdAndDelete(id);
  res
    .status(200)
    .json(new ApiResponse(200, coupon, "coupon deleted successfully"));
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true }
  );
  res
    .status(200)
    .json(new ApiResponse(200, coupon, "coupon updated successfully"));
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupon = await Coupon.find({});
  res
    .status(200)
    .json(new ApiResponse(200, coupon, "all coupons retrieved successfully"));
});
export { createCoupon, getCoupons, deleteCoupon, getAllCoupons, updateCoupon };
