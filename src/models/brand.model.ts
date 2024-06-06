import { timeStamp } from "console";
import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "brand name is required"],
    },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);
