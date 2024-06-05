import { Request } from "express";
import { Product } from "../models/product.model.js";
import {
  IProduct,
  IProductColor,
  IProductSize,
  searchBaseQuery,
  searchRequestQuery,
} from "../types/product.type.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import imageResizer from "../utils/imageResizer.js";
import isValidMongodbId from "../utils/isValidMongodbId.js";
import fs_extra from "fs-extra";
import mongoose, { SortOrder } from "mongoose";

const createProduct = asyncHandler(
  async (req: Request<{}, {}, IProduct>, res) => {
    const {
      uniqueId,
      title,
      highlight,
      price,
      MRP,
      brand,
      category,
      stock,
      color,
      colorName,
      size,
      moreDetails,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    if (!files || files?.length < 2) {
      throw new ApiError(400, "product must have at least 2 images");
    }

    const baseQuery: Partial<IProduct> = {};

    const discountPercentage = (price: number, MRP: number | undefined) =>
      Math.ceil((((MRP || price) - price) / (MRP || price)) * 100);

    if (colorName && size) {
      console.log("colorName and size", uniqueId);

      if (!highlight || !brand || !category || size.length === 0) {
        throw new ApiError(400, "all fields are required");
      }

      const sizeArr: IProductSize[] = size
        .sort((a, b) => a.price - b.price)
        .map((item) => ({
          ...item,
          discountPercent: discountPercentage(item.price, item.MRP),
        }));

      baseQuery.uniqueId =
        !uniqueId && colorName ? new mongoose.Types.ObjectId() : uniqueId;
      baseQuery.brand = brand;
      baseQuery.category = category;
      baseQuery.colorName = colorName;
      baseQuery.highlight = highlight;
      baseQuery.title = sizeArr[0].title;
      baseQuery.price = sizeArr[0].price;
      baseQuery.MRP = sizeArr[0].MRP;
      baseQuery.discountPercent = sizeArr[0].discountPercent;
      baseQuery.stock = sizeArr[0].stock;
      baseQuery.size = sizeArr;
      baseQuery.selectedSizeIndex = 0;
      if (color) baseQuery.color = color;
      if (moreDetails) baseQuery.moreDetails = moreDetails;
    }

    if (colorName && !size) {
      console.log(`only colorName`);

      if (
        !title ||
        !price ||
        !MRP ||
        !stock ||
        !highlight ||
        !brand ||
        !category
      ) {
        throw new ApiError(400, "all fields are required");
      }
      baseQuery.uniqueId =
        !uniqueId && colorName ? new mongoose.Types.ObjectId() : uniqueId;
      baseQuery.title = title;
      baseQuery.price = price;
      baseQuery.MRP = MRP;
      baseQuery.discountPercent = discountPercentage(price, MRP);
      baseQuery.stock = stock;
      baseQuery.highlight = highlight;
      baseQuery.brand = brand;
      baseQuery.category = category;
      baseQuery.colorName = colorName;
      if (color) baseQuery.color = color;
      if (moreDetails) baseQuery.moreDetails = moreDetails;
    }

    if (!colorName && size) {
      console.log(`only Size`);

      if (!highlight || !brand || !category || size.length === 0) {
        throw new ApiError(400, "all fields are required");
      }

      const sizeArr: IProductSize[] = size
        .sort((a, b) => a.price - b.price)
        .map((item) => ({
          ...item,
          discountPercent: discountPercentage(item.price, item.MRP),
        }));

      baseQuery.brand = brand;
      baseQuery.category = category;
      baseQuery.highlight = highlight;
      baseQuery.title = sizeArr[0].title;
      baseQuery.price = sizeArr[0].price;
      baseQuery.MRP = sizeArr[0].MRP;
      baseQuery.discountPercent = sizeArr[0].discountPercent;
      baseQuery.stock = sizeArr[0].stock;
      baseQuery.size = sizeArr;
      baseQuery.selectedSizeIndex = 0;
      if (moreDetails) baseQuery.moreDetails = moreDetails;
    }

    if (!colorName && !size) {
      console.log(`no color and no size`);
      if (
        !title ||
        !price ||
        !MRP ||
        !stock ||
        !highlight ||
        !brand ||
        !category
      ) {
        throw new ApiError(400, "all fields are required");
      }

      baseQuery.title = title;
      baseQuery.price = price;
      baseQuery.MRP = MRP;
      baseQuery.discountPercent = discountPercentage(price, MRP);
      baseQuery.stock = stock;
      baseQuery.highlight = highlight;
      baseQuery.brand = brand;
      baseQuery.category = category;
      if (moreDetails) baseQuery.moreDetails = moreDetails;
    }

    try {
      const imagesUrl = await imageResizer(files);
      const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
      const uploadResult = (await Promise.all(uploadPromise)).filter(
        (item): item is string => typeof item === "string"
      );
      baseQuery.image = uploadResult;
    } catch (error) {
      files.map((file) => async () => await fs_extra.remove(file.path));

      throw new ApiError(500, "internal sever error while uploading image");
    }

    try {
      let product = await Product.create(baseQuery);

      if (product.uniqueId && product.colorName) {
        const colorObj: IProductColor = {
          productId: product._id.toString(),
          image: product.image[0],
          name: product.colorName,
        };

        if (product.color) {
          const updateMany = await Product.updateMany(
            { uniqueId: product.uniqueId },
            { $push: { color: colorObj } }
          );

          product.color.push(colorObj);
        } else {
          product.color = [colorObj];
          const addColor = await product.save();
          product = addColor;
        }
      }

      res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
    } catch (error: any) {
      res.status(400).json(new ApiResponse(400, {}, error.message));
      throw new ApiError(400, error.message);
    }
  }
);

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

  const product: IProduct | null = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new ApiError(404, "product not found");
  }

  await deleteOnCloudinary(product.image);

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

const updateProduct = asyncHandler(
  async (req: Request<any & { id: string }, {}, IProduct>, res) => {
    const id = req.params.id;
    isValidMongodbId(id);
    const { title, highlight, price, MRP, stock, colorName, size } = req.body;

    const baseQuery: Partial<IProduct> = {};

    const discountPercentage = (price: number, MRP: number | undefined) =>
      Math.ceil((((MRP || price) - price) / (MRP || price)) * 100);

    if (title) baseQuery.title = title;
    if (highlight) baseQuery.highlight = highlight;
    if (price) baseQuery.price = price;
    if (MRP) baseQuery.MRP = MRP;
    if (stock) baseQuery.stock = stock;
    if (price) baseQuery.discountPercent = discountPercentage(price, MRP);

    if (size) {
      const sizeArr: IProductSize[] = size
        .sort((a, b) => a.price - b.price)
        .map((item) => ({
          ...item,
          discountPercent: discountPercentage(item.price, item.MRP),
        }));

      baseQuery.title = sizeArr[0].title;
      baseQuery.price = sizeArr[0].price;
      baseQuery.discountPercent = sizeArr[0].discountPercent;
      baseQuery.stock = sizeArr[0].stock;
      baseQuery.MRP = sizeArr[0].MRP || sizeArr[0].price;
      baseQuery.size = sizeArr;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, baseQuery, {
      new: true,
    });

    if (colorName && updatedProduct?.uniqueId) {
      await Product.updateMany(
        {
          $and: [
            { uniqueId: updatedProduct.uniqueId },
            { "color.productId": updatedProduct._id },
          ],
        },
        { $set: { "color.$.name": colorName } }
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  }
);

const searchAllProducts = asyncHandler(
  async (req: Request<{}, {}, {}, searchRequestQuery>, res) => {
    const {
      category,
      query,
      sort_by,
      price,
      brand,
      rating,
      ratingCount,
      discountPercent,
    } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Math.abs(Number(req.query.limit) || 10), 30);
    const skip = (page - 1) * limit;

    const baseQuery: searchBaseQuery = {};
    const sort: { [index: string]: SortOrder } = {};
    const getAndLteHandler = (item: any) =>
      JSON.parse(
        JSON.stringify(item).replace(
          /\b(gte|gt|lte|lt)\b/g,
          (match) => `$${match}`
        )
      );

    if (query) {
      const q = query
        .trim()
        .split(" ")
        .map((word) => `(?=.*${word})`)
        .join("");

      baseQuery["$or"] = [
        { title: { $regex: q, $options: "i" } },
        { "size.title": { $regex: q, $options: "i" } },
      ];
    }

    if (brand) baseQuery.brand = brand;
    if (category) baseQuery.category = category;
    if (price) baseQuery.price = getAndLteHandler(price);
    if (rating) baseQuery.rating = getAndLteHandler(rating);
    if (ratingCount) baseQuery.ratingCount = getAndLteHandler(ratingCount);
    if (discountPercent)
      baseQuery.discountPercent = getAndLteHandler(discountPercent);

    if (sort_by) {
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

    const matchStringArray = (array: IProductSize[], inputStr: string) => {
      const inputParts = inputStr.toLowerCase().split(" ");
      let bestMatch = 0;
      let bestScore = 0;

      array.forEach((s, i) => {
        const elem = s.title.toLowerCase();
        let score = 0;

        inputParts.forEach((part) => {
          if (elem.includes(part)) {
            score += 1;
          }
        });

        if (score > bestScore) {
          bestMatch = i;
          bestScore = score;
        }
      });

      return bestMatch;
    };

    products.forEach((product) => {
      if (product.size) {
        product.selectedSizeIndex = matchStringArray(
          product.size,
          query as string
        );
      }
    });

    res.status(200).json(
      new ApiResponse(200, {
        products,
        pageNumber: page,
        totalPages,
        totalProducts: count,
      })
    );
  }
);

const updateProductImage = asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;
  isValidMongodbId(id);

  const imageInd = [...new Set(imageIndex.split(","))]
    .map((item) => parseInt(item))
    .filter((item) => item < 5 && item >= 0)
    .sort();
  // console.log("imageIndex: ", imageIndex, "imageInd", imageInd);

  if (imageInd.length === 0) {
    throw new ApiError(404, "invalid image index");
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new ApiError(400, "Invalid image file");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const deleteImages = product.image.filter((_, i) => imageInd.includes(i));

  if (deleteImages.length !== files.length) {
    throw new ApiError(
      400,
      "please provide equal number of images and image index"
    );
  }

  await deleteOnCloudinary(deleteImages);

  let updateImages: string[] = [];

  try {
    const imagesUrl = await imageResizer(files);
    const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
    updateImages = (await Promise.all(uploadPromise)).filter(
      (item): item is string => typeof item === "string"
    );
  } catch (error) {
    files.map((file) => async () => await fs_extra.remove(file.path));
    throw new ApiError(500, "internal sever error while uploading image");
  }

  const baseQuery: any = {};

  updateImages.forEach((image, index) => {
    baseQuery[`image.${imageInd[index]}`] = image;
  });

  if (product.uniqueId && imageInd.includes(0)) {
    await Product.updateMany(
      {
        $and: [
          { uniqueId: product.uniqueId },
          { "color.productId": product._id },
        ],
      },
      { $set: { "color.$.image": updateImages[0] } }
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, baseQuery, {
    new: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "image updated successfully"));
});

const addProductImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const validImageIndex = 5 - product.image.length;

  if (validImageIndex === 0) {
    throw new ApiError(404, "Product already have all images");
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new ApiError(400, "Invalid image file");
  }

  if (files.length > validImageIndex) {
    throw new ApiError(
      400,
      `Invalid image files Only allowed ${validImageIndex} images`
    );
  }

  let updateImages: string[] = [];

  try {
    const imagesUrl = await imageResizer(files);
    const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
    updateImages = (await Promise.all(uploadPromise)).filter(
      (item): item is string => typeof item === "string"
    );
  } catch (error) {
    files.map((file) => async () => await fs_extra.remove(file.path));
    throw new ApiError(500, "internal sever error while uploading image");
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    product._id,
    { $push: { image: { $each: updateImages } } },
    { new: true }
  );

  res.status(200).json(new ApiResponse(200, updatedProduct, "images updated"));
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;
  isValidMongodbId(id);

  const imageInd = parseInt(imageIndex);
  if (!imageInd || imageInd > 4 || imageInd < 2) {
    throw new ApiError(
      404,
      imageInd === 1 || imageInd === 2
        ? "You can not delete first and secound image"
        : "invalid image index"
    );
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const deleteImage = product.image.filter((_, i) => i === imageInd);

  if (deleteImage.length === 0) {
    throw new ApiError(404, "product image does not exist");
  }

  await deleteOnCloudinary(deleteImage);

  const updatedProduct = await Product.findByIdAndUpdate(
    product._id,
    { $pull: { image: deleteImage[0] } },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "image deleted successfully"));
});

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
  updateProductImage,
  addProductImage,
  deleteProductImage,
  deleteAllProducts,
};
