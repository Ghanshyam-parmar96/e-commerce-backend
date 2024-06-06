import { Request } from "express";
import { Category } from "../models/category.model.js";
import { ICategory, searchCategoryQuery } from "../types/product.type.js";
import asyncHandler from "../utils/asyncHandler.js";
import imageResizer from "../utils/imageResizer.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import fs_extra from "fs-extra";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import isValidMongodbId from "../utils/isValidMongodbId.js";
import { SortOrder } from "mongoose";

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const file = req.files as Express.Multer.File[];

  if (!name) throw new Error("Name is required");
  if (!file) throw new Error("Image is required");

  const baseQuery: Partial<ICategory> = { name };

  try {
    const imagesUrl = await imageResizer(file);
    const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
    const uploadResult = (await Promise.all(uploadPromise)).filter(
      (item): item is string => typeof item === "string"
    );
    baseQuery.image = uploadResult[0];
  } catch (error) {
    file.map((file) => async () => await fs_extra.remove(file.path));

    throw new ApiError(500, "internal sever error while uploading image");
  }

  const category = await Category.create(baseQuery);
  res
    .status(201)
    .json(new ApiResponse(201, category, "category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  isValidMongodbId(id);

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "category not found");

  const baseQuery: Partial<ICategory> = {};

  if (name) baseQuery.name = name;

  const files = req.files as Express.Multer.File[];

  if (files && files.length === 1) {
    await deleteOnCloudinary([category.image]);

    try {
      const imagesUrl = await imageResizer(files);
      const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
      const uploadResult = (await Promise.all(uploadPromise)).filter(
        (item): item is string => typeof item === "string"
      );
      baseQuery.image = uploadResult[0];
    } catch (error) {
      files.map((file) => async () => await fs_extra.remove(file.path));
      throw new ApiError(500, "internal sever error while uploading image");
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, baseQuery, {
    new: true,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, "category not found");

  await deleteOnCloudinary([category.image]);

  res
    .status(200)
    .json(new ApiResponse(200, category, "category deleted successfully"));
});

const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "category not found");

  res
    .status(200)
    .json(new ApiResponse(200, category, "category fetched successfully"));
});

const getAllCategories = asyncHandler(async (_, res) => {
  const categories = await Category.find();

  res
    .status(200)
    .json(new ApiResponse(200, categories, "categories fetched successfully"));
});

const searchCategory = asyncHandler(
  async (req: Request<{}, {}, {}, searchCategoryQuery>, res) => {
    const { query, sort_by } = req.query;

    const sort: { [index: string]: SortOrder } = {};
    const baseQuery: { name?: { $regex: string; $options: string } } = {};

    if (sort_by) {
      const [name, type] = sort_by.split("-");
      sort[name] = type === "desc" ? -1 : 1;
    }

    if (query) {
      baseQuery.name = { $regex: query, $options: "i" };
    }

    const categories = await Category.find(baseQuery)
      .sort(sort_by && sort)
      .limit(30);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          categories,
          "search categories fetched successfully"
        )
      );
  }
);

export {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
  searchCategory,
};
