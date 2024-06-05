import mongoose from "mongoose";
import {
  IProduct,
  IProductColor,
  IProductSize,
} from "../types/product.type.js";

const productSize = new mongoose.Schema<IProductSize>({
  name: {
    type: String,
    required: [true, "Size name is required"],
  },
  title: {
    type: String,
    required: [true, "Size title is required"],
  },
  stock: {
    type: Number,
    required: [true, "Size stock is required"],
  },
  price: {
    type: Number,
    required: [true, "Size price is required"],
  },
  MRP: {
    type: Number,
  },
  discountPercent: {
    type: Number,
    required: [true, "size discountPercent is required"],
  },
});

const productColor = new mongoose.Schema<IProductColor>({
  productId: {
    type: String,
    required: [true, "Color Product id is required"],
  },
  image: {
    type: String,
    required: [true, "Color image is required"],
  },
  name: {
    type: String,
    required: [true, "Color name is required"],
  },
});

const productSchema = new mongoose.Schema<IProduct>(
  {
    uniqueId: {
      type: mongoose.Types.ObjectId,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
    },
    brand: {
      type: String,
      required: [true, "brand name is required"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    image: {
      type: [String],
      required: [true, "Product image is required"],
    },
    highlight: {
      type: [String],
      required: [true, "Product highlight is required"],
    },
    colorName: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
    },
    MRP: {
      type: Number,
    },
    discountPercent: {
      type: Number,
      required: [true, "size discountPercent is required"],
    },
    stock: {
      type: Number,
      required: [true, "stock quantity is required"],
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    color: {
      type: [productColor],
      default: undefined,
    },
    size: {
      type: [productSize],
      default: undefined,
    },
    selectedSizeIndex: {
      type: Number,
    },
    moreDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetails",
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
