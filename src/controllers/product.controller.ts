import { Request } from "express";
import { Product } from "../models/product.model.js";
import {
  ProductInterface,
  productColorOptions,
  searchBaseQuery,
  searchRequestQuery,
} from "../types/product.type.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import imageResizer from "../utils/imageResizer.js";
import isValidMongodbId from "../utils/isValidMongodbId.js";
import {
  colorAndSizeBothAreNotGiven,
  colorAndSizeBothGiven,
  onlyColorGiven,
  onlySizeGiven,
} from "../validators/product.validation.js";
import fs_extra from "fs-extra";
import { SortOrder } from "mongoose";

const createProduct = asyncHandler(async (req, res) => {
  const { isColor, isSize } = req.body;

  let productObj;

  if (isColor && isSize) productObj = colorAndSizeBothGiven(req.body);
  if (!isColor && !isSize) productObj = colorAndSizeBothAreNotGiven(req.body);
  if (!isColor && isSize) productObj = onlySizeGiven(req.body);
  if (isColor && !isSize) productObj = onlyColorGiven(req.body);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.image || files?.image?.length < 2) {
    throw new ApiError(400, "product must have at least 2 images");
  }

  if (
    ((isColor && isSize) || (!isSize && isColor)) &&
    files?.colorImage?.length > 0
  ) {
    if (productObj?.color?.length !== files.colorImage.length) {
      throw new ApiError(400, "every color must have a image");
    }

    try {
      const imagesUrl = await imageResizer(files.colorImage);
      const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
      const uploadResult = await Promise.all(uploadPromise);

      productObj.color = productObj.color.map((property, i) => ({
        ...property,
        image: uploadResult[i] || "",
      }));
    } catch (error) {
      for (const key in files) {
        await Promise.all(
          files[key].map((file) => async () => await fs_extra.remove(file.path))
        );
      }

      throw new ApiError(500, "internal sever error while uploading image");
    }
  }

  try {
    const imagesUrl = await imageResizer(files.image);
    const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
    const uploadResult = await Promise.all(uploadPromise);
    productObj = { ...productObj, image: uploadResult };
  } catch (error) {
    for (const key in files) {
      await Promise.all(
        files[key].map((file) => async () => await fs_extra.remove(file.path))
      );
    }

    throw new ApiError(500, "internal sever error while uploading image");
  }

  try {
    const product = await Product.create(productObj);

    res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error: any) {
    res.status(400).json(new ApiResponse(400, {}, error.message));
    throw new ApiError(400, error.message);
  }
});

const getProduct = asyncHandler(async (req, res) => {
  const id: string = req.params.id;
  isValidMongodbId(id);
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "product not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const id: string = req.params.id;
  isValidMongodbId(id);

  const product: ProductInterface | null = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new ApiError(404, "product not found");
  }

  const localFilePath: string[] = [];

  product.image &&
    product.image.forEach((image) => {
      localFilePath.push(image);
    });

  if (
    (product.isColor && product.isSize) ||
    (!product.isSize && product.isColor)
  ) {
    product.color &&
      product.color.forEach((color) => {
        localFilePath.push(color.image);
      });
  }

  await deleteOnCloudinary(localFilePath);

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product deleted successfully"));
});

const getAllProducts = asyncHandler(async (_, res) => {
  const products = await Product.find({});
  res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

const getAllCategories = asyncHandler(async (_, res) => {
  const categories = await Product.distinct("category");
  res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

const getLatestProducts = asyncHandler(async (_, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).limit(20);
  res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const id: string = req.params.id;
  isValidMongodbId(id);

  const { isColor, isSize, image }: ProductInterface = req.body;

  let productObj;

  if (isColor && isSize) productObj = colorAndSizeBothGiven(req.body);
  if (!isColor && !isSize) productObj = colorAndSizeBothAreNotGiven(req.body);
  if (!isColor && isSize) productObj = onlySizeGiven(req.body);
  if (isColor && !isSize) productObj = onlyColorGiven(req.body);

  if (!image || image.length < 2) {
    throw new ApiError(400, "product must have at least 2 images");
  }

  const color: productColorOptions[] = req.body?.color;

  if (
    ((isColor && isSize) || (!isSize && isColor)) &&
    !color?.every((color) => "image" in color)
  ) {
    throw new ApiError(400, "every color must have image");
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const searchAllProducts = asyncHandler(
  async (req: Request<{}, {}, {}, searchRequestQuery>, res) => {
    const { category, query, sort_by, price } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Math.abs(Number(req.query.limit) || 10), 30);
    const skip = (page - 1) * limit;

    const baseQuery: searchBaseQuery = {};
    const sort: { [index: string]: SortOrder } = {};

    if (query) {
      baseQuery.highlight = {
        $regex: query
          .trim()
          .split(" ")
          .map((word) => `(?=.*${word})`)
          .join(""),
        $options: "i",
      };
    }

    if (price) {
      if (price?.gte) price.gte = Number(price.gte);
      if (price?.lte) price.lte = Number(price.lte);
      if (price?.lt) price.lt = Number(price.lt);
      if (price?.gt) price.gt = Number(price.gt);
      baseQuery.price = JSON.parse(
        JSON.stringify(price).replace(
          /\b(gte|gt|lte|lt)\b/g,
          (match) => `$${match}`
        )
      );
    }

    if (category && typeof category === "string") baseQuery.category = category;

    if (sort_by && typeof sort_by === "string") {
      const [name, type] = sort_by.split("-");
      sort[name] = type === "desc" ? -1 : 1;
    }

    const productPromise = Product.find(baseQuery)
      .sort(sort_by && sort)
      .limit(limit)
      .skip(skip);

    const [products, count] = await Promise.all([
      productPromise,
      Product.countDocuments(baseQuery),
    ]);

    const totalPages = Math.ceil(count / limit);

    res.status(200).json(
      new ApiResponse(200, {
        products,
        totalPages,
        totalProducts: count,
      })
    );
  }
);

const deleteAllProducts = asyncHandler(async (_, res) => {
  await Product.deleteMany({});
  res
    .status(200)
    .json(new ApiResponse(200, null, "All products deleted successfully"));
});

export {
  createProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  getLatestProducts,
  getAllCategories,
  searchAllProducts,
  deleteAllProducts,
};
