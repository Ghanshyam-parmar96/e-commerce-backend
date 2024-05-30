import { Product_available_size } from "../constants.js";
import { ProductInterface } from "../types/product.type.js";
import { ApiError } from "../utils/apiError.js";

type ObjectWithKeys<T> = {
  [K in keyof T]: any;
};

const filterObject = <T extends ObjectWithKeys<T>>(
  obj: T,
  requiredKeys: (keyof T)[],
  optionalKeys?: (keyof T)[]
) => {
  if (
    typeof obj !== "object" ||
    Array.isArray(obj) ||
    !Array.isArray(requiredKeys)
  ) {
    return {
      success: false,
      message:
        "First argument of function must be object and secound argument must be array of string",
      data: {},
    };
  }

  // if requireKeys are available
  if (!requiredKeys.every((field) => obj.hasOwnProperty(field))) {
    return {
      success: false,
      message: "please provide all required keys",
      data: {},
    };
  }

  if (typeof optionalKeys !== "undefined" && Array.isArray(optionalKeys)) {
    const isOptionalKeys = optionalKeys.filter((key) =>
      obj.hasOwnProperty(key)
    );
    requiredKeys = [...requiredKeys, ...isOptionalKeys];
  }

  const filteredEntries = requiredKeys.map((key) => [key, obj[key]]);

  return {
    success: true,
    message: "is valid object",
    data: Object.fromEntries(filteredEntries),
  };
};

const filterArray = <T>(
  arr: T[],
  requiredKey: (keyof T)[],
  optionalKeys?: (keyof T)[]
) => {
  if (!Array.isArray(arr) || !Array.isArray(requiredKey)) {
    return {
      success: false,
      message: "filterArray first and secound argument must be Array",
      data: [],
    };
  }

  const validData = [];

  for (const el of arr) {
    const data = filterObject(el, requiredKey, optionalKeys);
    if (!data.success) {
      return {
        success: false,
        message: data.message,
        data: [],
      };
    }
    validData.push(data.data);
  }

  return {
    success: true,
    message: "",
    data: validData,
  };
};

const colorAndSizeBothGiven = (
  requiredProperties: ProductInterface
): ProductInterface => {
  const requiredObj = filterObject(
    requiredProperties,
    [
      "title",
      "highlight",
      "category",
      "brand",
      "isColor",
      "isSize",
      "color",
      "size",
    ],
    ["image"]
  );

  if (!requiredObj.success) {
    throw new ApiError(400, "please provide all required properties");
  }

  requiredProperties = requiredObj.data;

  // Check if size property is available
  if (
    typeof requiredProperties.size !== "object" ||
    Array.isArray(requiredProperties.size) ||
    Object.keys(requiredProperties.size).length <= 0
  ) {
    throw new ApiError(
      400,
      "The 'size' property must be an object and provide the required fields"
    );
  }

  // check if color is available and its an array
  if (
    !Array.isArray(requiredProperties.color) ||
    requiredProperties.color.length === 0
  ) {
    throw new ApiError(
      400,
      "The color property must be an array and provide the required fields"
    );
  }

  const isColorValid = filterArray(
    requiredProperties.color,
    ["name", "connectionId"],
    ["image"]
  );

  if (!isColorValid.success) {
    throw new ApiError(
      400,
      "Please specify all required fields for each color object"
    );
  }

  const colorId = isColorValid.data.map((el) => el.connectionId);
  const colorUniqueKey = [...new Set(colorId)].length;

  if (colorId.length !== colorUniqueKey) {
    throw new ApiError(400, "the 'color' property must have a unique id");
  }

  requiredProperties.color = isColorValid.data;

  const requiredSizes = Product_available_size;
  const givenSize = Object.keys(requiredProperties.size)[0];
  const isIncludeInRequiredSize = requiredSizes.includes(givenSize);

  if (
    !isIncludeInRequiredSize ||
    !Array.isArray(requiredProperties?.size[givenSize])
  ) {
    throw new ApiError(
      400,
      isIncludeInRequiredSize
        ? `The 'size' property must be of size ${givenSize} and must be an array`
        : "invalid size property"
    );
  }

  const sizeArray = requiredProperties?.size[givenSize];

  const isSizeValid = filterArray(sizeArray, ["name", "colorStock"]);

  if (!isSizeValid.success) {
    throw new ApiError(
      400,
      "Please specify all required fields for each size object"
    );
  }

  const sizeColorStock: any[] = [];
  for (const el of sizeArray) {
    if (!Array.isArray(el.colorStock)) {
      throw new ApiError(400, "colorStock must be an Array");
    }
    const data = filterArray(
      el.colorStock,
      ["connectionId", "stock", "price"],
      ["discountedPrice"]
    );

    if (!data.success) {
      throw new ApiError(400, "please provide colorStock required fields");
    }

    if (
      data.data.length !== colorUniqueKey ||
      !data.data.every((el) => colorId.includes(el.connectionId))
    ) {
      throw new ApiError(
        400,
        "Every colorStock must have connectionId of every color"
      );
    }

    const colorStockData = data.data.map((data) => ({
      ...data,
      discountPercent: Math.ceil(
        ((data.price - (data?.discountedPrice || data.price)) / data.price) *
          100
      ),
    }));

    sizeColorStock.push(colorStockData);
  }

  requiredProperties.size[givenSize] = isSizeValid.data.map((data, i) => ({
    ...data,
    colorStock: sizeColorStock[i],
  }));

  return requiredProperties;
};

const onlySizeGiven = (
  requiredProperties: ProductInterface
): ProductInterface => {
  const requiredObj = filterObject(
    requiredProperties,
    ["title", "highlight", "category", "brand", "isColor", "isSize", "size"],
    ["image"]
  );

  if (!requiredObj.success) {
    throw new ApiError(400, "please provide all required properties");
  }

  requiredProperties = requiredObj.data;

  if (
    typeof requiredProperties.size !== "object" ||
    Array.isArray(requiredProperties.size) ||
    Object.keys(requiredProperties.size).length <= 0
  ) {
    throw new ApiError(
      400,
      "size property must be an object and provide all required fields"
    );
  }

  const requiredSizes = Product_available_size;
  const givenSize = Object.keys(requiredProperties.size)[0];
  const isIncludeInRequiredSize = requiredSizes.includes(givenSize);

  if (
    !isIncludeInRequiredSize ||
    !Array.isArray(requiredProperties?.size[givenSize])
  ) {
    throw new ApiError(
      400,
      isIncludeInRequiredSize
        ? `The'size' property must be of size ${givenSize} and must be an array`
        : "invalid size property"
    );
  }

  const sizeArray = requiredProperties?.size[givenSize];
  const isSizeValid = filterArray(
    sizeArray,
    ["name", "stock", "price"],
    ["discountedPrice"]
  );

  if (!isSizeValid.success) {
    throw new ApiError(
      400,
      "Please specify all required fields for each size object"
    );
  }

  const isSizeValidData = isSizeValid.data.map((data) => ({
    ...data,
    discountPercent: Math.ceil(
      ((data.price - (data?.discountedPrice || data.price)) / data.price) * 100
    ),
  }));

  requiredProperties.size[givenSize] = isSizeValidData;

  return requiredProperties;
};

const onlyColorGiven = (
  requiredProperties: ProductInterface
): ProductInterface => {
  const requiredObj = filterObject(
    requiredProperties,
    ["title", "highlight", "category", "brand", "isColor", "isSize", "color"],
    ["image"]
  );

  if (!requiredObj.success) {
    throw new ApiError(400, "please provide all required properties");
  }

  requiredProperties = requiredObj.data;

  if (
    !Array.isArray(requiredProperties.color) ||
    requiredProperties.color.length <= 0
  ) {
    throw new ApiError(
      400,
      "color property must be required an array of object and it's length must be greater than zero"
    );
  }

  const isValidColor = filterArray(
    requiredProperties?.color,
    ["name", "stock", "price"],
    ["discountedPrice", "image"]
  );

  if (!isValidColor.success) {
    throw new ApiError(
      400,
      "Please specify all required fields for each color object"
    );
  }

  requiredProperties.color = isValidColor.data.map((data) => ({
    ...data,
    discountPercent: Math.ceil(
      ((data.price - (data?.discountedPrice || data.price)) / data.price) * 100
    ),
  }));

  return requiredProperties;
};

const colorAndSizeBothAreNotGiven = (
  requiredProperties: ProductInterface
): ProductInterface => {
  const requiredObj = filterObject(
    requiredProperties,
    [
      "title",
      "highlight",
      "category",
      "brand",
      "isColor",
      "isSize",
      "price",
      "stock",
    ],
    ["image"]
  );

  if (!requiredObj.success) {
    throw new ApiError(400, "please provide all required properties");
  }

  requiredProperties = requiredObj.data;

  const discountPercentage: number = Math.ceil(
    ((requiredProperties?.price! -
      (requiredProperties?.discountedPrice || requiredProperties.price)!) /
      requiredProperties?.price!) *
      100
  );

  requiredProperties.discountPercent = discountPercentage;

  return requiredProperties;
};

export {
  colorAndSizeBothAreNotGiven,
  colorAndSizeBothGiven,
  onlyColorGiven,
  onlySizeGiven,
};
