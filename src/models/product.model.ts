import mongoose from "mongoose";

const optionalFields = new mongoose.Schema({
  price: {
    type: Number,
  },
  stock: {
    type: Number,
    min: [1, "Product quantity must be greater than 1"],
  },
  discountedPrice: {
    type: Number,
  },
  discountPercent: {
    type: Number,
  },
});

const sizeColorStock = new mongoose.Schema({
  connectionId: {
    type: "string",
  },
  ...optionalFields.obj,
});

const productSizeFields = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Size name is required"],
  },
  colorStock: {
    type: [sizeColorStock],
    default: undefined,
  },
  ...optionalFields.obj,
});

const productSize = new mongoose.Schema({
  ram: {
    type: [productSizeFields],
    default: undefined,
  },
  liter: {
    type: [productSizeFields],
    default: undefined,
  },
});

const productColor = new mongoose.Schema({
  connectionId: {
    type: "string",
  },
  name: {
    type: String,
    required: [true, "Size name is required"],
  },
  image: {
    type: String,
    required: [true, "Product image is required"],
  },
  ...optionalFields.obj,
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      lowercase: true,
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
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isSize: {
      type: Boolean,
      required: [true, "Product isSize is required"],
    },
    isColor: {
      type: Boolean,
      required: [true, "Product isColor is required"],
    },
    size: {
      type: productSize,
    },
    color: {
      type: [productColor],
      default: undefined,
    },
    ...optionalFields.obj,
    moreDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetails",
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
