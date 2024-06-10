import mongoose from "mongoose";
import { IUser } from "../types/product.type.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const addressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "address is required"],
  },
  city: {
    type: String,
    required: [true, "city is required"],
  },
  state: {
    type: String,
    required: [true, "state is required"],
  },
  country: {
    type: String,
    required: [true, "country is required"],
  },
  pinCode: {
    type: String,
    required: [true, "pin code is required"],
  },
});

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "fullName is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: Number,
      unique: true,
    },
    DOB: {
      type: Date,
      required: [true, "age is required"],
    },
    gender: {
      type: String,
      required: [true, "gender is required"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: {
      type: Number,
    },
    verifyCodeExpire: {
      type: Date,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dmrboyo0j/image/upload/v1717587362/e-commerce/product_images/vsuyokcgzsw332zz4483.webp",
    },
    refreshToken: {
      type: String,
    },
    address: {
      type: [addressSchema],
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  enteredPassword: string
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const data: { _id: string; isAdmin?: boolean } = { _id: this._id };
  if (this.isAdmin) data.isAdmin = true;

  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model<IUser>("User", userSchema);
