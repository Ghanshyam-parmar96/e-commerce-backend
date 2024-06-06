import mongoose from "mongoose";
import { ICategory } from "../types/product.type.js";

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "category name is required"],
    },
    image: {
      type: String,
      required: [true, "category image is required"],
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
