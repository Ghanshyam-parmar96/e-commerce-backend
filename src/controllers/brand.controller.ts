import { Request } from "express";
import { Brand } from "../models/brand.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SortOrder } from "mongoose";
import { searchCategoryQuery } from "../types/product.type.js";

const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) throw new ApiError(400, "brand name is required");

  const brand = await Brand.create({ name });
  res
    .status(201)
    .json(new ApiResponse(200, brand, "brand created successfully"));
});

const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find();
  res
    .status(200)
    .json(new ApiResponse(200, brands, "all brands retrieved successfully"));
});

const getBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brand = await Brand.findById(id);
  if (!brand) throw new ApiError(404, "brand not found");
  res
    .status(200)
    .json(new ApiResponse(200, brand, "brand retrieved successfully"));
});

const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) throw new ApiError(400, "brand name is required");

  const brand = await Brand.findByIdAndUpdate(id, { name }, { new: true });
  if (!brand) throw new ApiError(404, "brand not found");

  res
    .status(200)
    .json(new ApiResponse(200, brand, "brand updated successfully"));
});

const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) throw new ApiError(404, "brand not found");

  res
    .status(200)
    .json(new ApiResponse(200, brand, "brand deleted successfully"));
});

const searchBrand = asyncHandler(
  async (req: Request<{}, {}, {}, searchCategoryQuery>, res) => {
    const { query, sort_by } = req.query;

    const page = Math.abs(Number(req.query.page)) || 1;
    const limit = Math.min(Math.abs(Number(req.query.limit)), 20);
    const skip = (page - 1) * limit;

    const sort: { [index: string]: SortOrder } = {};
    const baseQuery: { name?: { $regex: string; $options: string } } = {};

    if (query) baseQuery.name = { $regex: query, $options: "i" };

    if (sort_by) {
      const [name, type] = sort_by.split("-");
      sort[name] = type === "desc" ? -1 : 1;
    }

    const brands = await Brand.find(baseQuery)
      .sort(sort_by && sort)
      .skip(skip)
      .limit(limit);
    if (!brands) throw new ApiError(404, "brand not found");

    res
      .status(200)
      .json(new ApiResponse(200, brands, "brands retrieved successfully"));
  }
);

export {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrand,
  getAllBrands,
  searchBrand,
};
