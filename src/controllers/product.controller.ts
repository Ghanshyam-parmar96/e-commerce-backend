import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  colorAndSizeBothAreNotGiven,
  colorAndSizeBothGiven,
  onlyColorGiven,
  onlySizeGiven,
} from "../validators/product.validation.js";

const createProduct = asyncHandler(async (req, res) => {
  const { isColor, isSize } = req.body;

  let productObj = {
    success: false,
    message: "",
    data: {},
  };

  const image = [
    "top seling phone",
    "128 gb storage",
    "12 bg ram",
    "powerfull prosesor",
  ];

  if (isColor && isSize) productObj = colorAndSizeBothGiven(req.body);
  if (!isColor && !isSize) productObj = colorAndSizeBothAreNotGiven(req.body);
  if (!isColor && isSize) productObj = onlySizeGiven(req.body);
  if (isColor && !isSize) productObj = onlyColorGiven(req.body);

  if (!productObj.success) {
    res.status(400).json(new ApiResponse(400, {}, productObj.message));
    return;
  }

  try {
    const product = await Product.create({ ...productObj.data, image });

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
