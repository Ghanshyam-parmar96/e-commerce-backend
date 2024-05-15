import { Product_available_size } from "../constants.js";
import {
  ProductFnReturnType,
  ProductInterface,
} from "../types/product.type.js";

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
): ProductFnReturnType => {
  const requiredObj = filterObject(requiredProperties, [
    "title",
    "highlight",
    "category",
    "brand",
    "isColor",
    "isSize",
    "color",
    "size",
  ]);

  if (!requiredObj.success) {
    return {
      success: false,
      message: "please provide all required properties",
      data: {},
    };
  }

  requiredProperties = requiredObj.data;

  if (
    !requiredProperties.hasOwnProperty("color") ||
    !requiredProperties.hasOwnProperty("size")
  ) {
    return {
      success: false,
      message: "Both 'color' and 'size' properties are required",
      data: {},
    };
  }

  // Check if size property is available
  if (
    typeof requiredProperties.size !== "object" ||
    Array.isArray(requiredProperties.size) ||
    Object.keys(requiredProperties.size).length <= 0
  ) {
    return {
      success: false,
      message:
        "The 'size' property must be an object and provide the required fields",
      data: {},
    };
  }

  // check if color is available and its an array
  if (
    !Array.isArray(requiredProperties.color) ||
    requiredProperties.color.length === 0
  ) {
    return {
      success: false,
      message:
        "The 'color' property must be an array and provide the required fields",
      data: {},
    };
  }

  const isColorValid = filterArray(requiredProperties.color, [
    "name",
    "image",
    "connectionId",
  ]);

  if (!isColorValid.success) {
    return {
      success: false,
      message: "Please specify all required fields for each color object",
      data: {},
    };
  }

  const colorId = isColorValid.data.map((el) => el.connectionId);
  const colorUniqueKey = [...new Set(colorId)].length;

  if (colorId.length !== colorUniqueKey) {
    return {
      success: false,
      message: "The 'color' property must have a unique _id",
      data: {},
    };
  }

  requiredProperties.color = isColorValid.data;

  const requiredSizes = Product_available_size;
  const givenSize = Object.keys(requiredProperties.size)[0];
  const isIncludeInRequiredSize = requiredSizes.includes(givenSize);

  if (
    !isIncludeInRequiredSize ||
    !Array.isArray(requiredProperties?.size[givenSize])
  ) {
    return {
      success: false,
      message: isIncludeInRequiredSize
        ? `The 'size' property must be of size ${givenSize} and must be an array`
        : "invalid size property",
      data: {},
    };
  }

  const sizeArray = requiredProperties?.size[givenSize];

  const isSizeValid = filterArray(sizeArray, ["name", "colorStock"]);

  if (!isSizeValid.success) {
    return {
      success: false,
      message:
        "Please specify all required fields for each size object and its colorStock",
      data: {},
    };
  }

  const sizeColorStock: any[] = [];
  for (const el of sizeArray) {
    if (!Array.isArray(el.colorStock)) {
      return {
        success: false,
        message: "colorStock must be an Array",
        data: [],
      };
    }
    const data = filterArray(
      el.colorStock,
      ["connectionId", "stock", "price"],
      ["discountedPrice"]
    );

    if (!data.success) {
      return {
        success: false,
        message: "please provide colorStock required fields",
        data: [],
      };
    }

    if (
      data.data.length !== colorUniqueKey ||
      !data.data.every((el) => colorId.includes(el.connectionId))
    ) {
      return {
        success: false,
        message: `only ${colorUniqueKey} number of colorStock valid and Every colorStock must have connectionId of every color`,
        data: [],
      };
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

  return {
    success: true,
    message: "Product created successfully",
    data: requiredProperties,
  };
};

const onlySizeGiven = (
  requiredProperties: ProductInterface
): ProductFnReturnType => {
  const requiredObj = filterObject(requiredProperties, [
    "title",
    "highlight",
    "category",
    "brand",
    "isColor",
    "isSize",
    "size",
  ]);

  if (!requiredObj.success) {
    return {
      success: false,
      message: "please provide all required properties",
      data: {},
    };
  }

  requiredProperties = requiredObj.data;

  if (
    typeof requiredProperties.size !== "object" ||
    Array.isArray(requiredProperties.size) ||
    Object.keys(requiredProperties.size).length <= 0
  ) {
    return {
      success: false,
      message:
        "The 'size' property must be an object and provide the required fields",
      data: {},
    };
  }

  const requiredSizes = Product_available_size;
  const givenSize = Object.keys(requiredProperties.size)[0];
  const isIncludeInRequiredSize = requiredSizes.includes(givenSize);

  if (
    !isIncludeInRequiredSize ||
    !Array.isArray(requiredProperties?.size[givenSize])
  ) {
    return {
      success: false,
      message: isIncludeInRequiredSize
        ? `The 'size' property must be of size ${givenSize} and must be an array`
        : "invalid size property",
      data: {},
    };
  }

  const sizeArray = requiredProperties?.size[givenSize];
  const isSizeValid = filterArray(
    sizeArray,
    ["name", "stock", "price"],
    ["discountedPrice"]
  );

  if (!isSizeValid.success) {
    return {
      success: false,
      message: `Please specify all required fields for size of ${givenSize}`,
      data: {},
    };
  }

  const isSizeValidData = isSizeValid.data.map((data) => ({
    ...data,
    discountPercent: Math.ceil(
      ((data.price - (data?.discountedPrice || data.price)) / data.price) * 100
    ),
  }));

  requiredProperties.size[givenSize] = isSizeValidData;

  return {
    success: true,
    message: "Product created successfully",
    data: requiredProperties,
  };
};

const onlyColorGiven = (
  requiredProperties: ProductInterface
): ProductFnReturnType => {
  const requiredObj = filterObject(requiredProperties, [
    "title",
    "highlight",
    "category",
    "brand",
    "isColor",
    "isSize",
    "color",
  ]);

  if (!requiredObj.success) {
    return {
      success: false,
      message: "please provide all required properties",
      data: {},
    };
  }

  requiredProperties = requiredObj.data;

  if (
    !Array.isArray(requiredProperties.color) ||
    requiredProperties.color.length <= 0
  ) {
    return {
      success: false,
      message:
        "color property must be required an array of object and it's length must be greater than zero",
      data: {},
    };
  }

  const isValidColor = filterArray(
    requiredProperties?.color,
    ["name", "image", "stock", "price"],
    ["discountedPrice"]
  );

  if (!isValidColor.success) {
    return {
      success: false,
      message: "please specify a required field for color",
      data: {},
    };
  }

  const isValidColorData = isValidColor.data.map((data) => ({
    ...data,
    discountPercent: Math.ceil(
      ((data.price - (data?.discountedPrice || data.price)) / data.price) * 100
    ),
  }));

  requiredProperties.color = isValidColorData;

  return {
    success: true,
    message: "product created successfully",
    data: requiredProperties,
  };
};

const colorAndSizeBothAreNotGiven = (
  requiredProperties: ProductInterface
): ProductFnReturnType => {
  const requiredObj = filterObject(requiredProperties, [
    "title",
    "highlight",
    "category",
    "brand",
    "isColor",
    "isSize",
    "price",
    "stock",
  ]);

  if (!requiredObj.success) {
    return {
      success: false,
      message: "please provide all required properties",
      data: {},
    };
  }

  requiredProperties = requiredObj.data;

  const discountPercentage: number = Math.ceil(
    ((requiredProperties?.price! -
      (requiredProperties?.discountedPrice || requiredProperties.price)!) /
      requiredProperties?.price!) *
      100
  );

  requiredProperties.discountPercent = discountPercentage;

  return {
    success: true,
    message: "product created successfully",
    data: requiredProperties,
  };
};

export {
  colorAndSizeBothAreNotGiven,
  colorAndSizeBothGiven,
  onlyColorGiven,
  onlySizeGiven,
};
