import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createProduct = asyncHandler(async (req, res) => {
  const { price, discountedPrice } = req.body;

  const totalDiscount: number = discountedPrice || price;
  const discountPercentage: number = Math.ceil(
    ((price - totalDiscount) / 100) * 100
  );

  try {
    const product = await Product.create({
      ...req.body,
      discountPercentage,
    });

    res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error: any) {
    res.status(400).json(new ApiResponse(400, {}, error.message));
  }
});

const deleteAllProducts = asyncHandler(async (req, res) => {
  await Product.deleteMany({});
  res
    .status(200)
    .json(new ApiResponse(200, null, "All products deleted successfully"));
});

export { createProduct, deleteAllProducts };
