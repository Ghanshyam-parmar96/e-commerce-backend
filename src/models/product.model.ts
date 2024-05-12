import mongoose from "mongoose";

const productSizeFields = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Size name is required"],
  },
  stock: {
    type: Number,
    required: [true, "Size stock is required"],
  },
  price: {
    type: Number,
    required: [true, "Size price is required"],
  },
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
  ...productSizeFields.obj,
  image: {
    type: String,
    required: [true, "Product image is required"],
  },
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      lowercase: true,
      required: [true, "Product title is required"],
    },
    price: {
      type: Number,
      required: [true, "Product is required"],
    },
    brand: {
      type: String,
      required: [true, "brand name is required"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [1, "Product quantity must be greater than 1"],
    },
    discountedPrice: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
    images: {
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
    size: {
      type: productSize,
    },
    color: {
      type: [productColor],
    },
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
