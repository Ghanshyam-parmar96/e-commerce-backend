import { Request } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  IUser,
  searchUserBaseQuery,
  searchUserQuery,
} from "../types/product.type.js";
import imageResizer from "../utils/imageResizer.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import fs_extra from "fs-extra";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { cookieOptions } from "../constants.js";
import jwt from "jsonwebtoken";
import { SortOrder } from "mongoose";
import isValidMongodbId from "../utils/isValidMongodbId.js";

const createUser = asyncHandler(async (req: Request<{}, {}, IUser>, res) => {
  const {
    avatar,
    password,
    email,
    phoneNumber,
    isVerified,
    DOB,
    gender,
    fullName,
  } = req.body;

  if (isVerified && isVerified === true) {
    if (!avatar) throw new ApiError(400, "all fields are required");
  } else {
    if (!DOB || !gender || !password || !phoneNumber)
      throw new ApiError(400, "all fields are required");
  }

  const isUserExist = await User.findOne({ $or: [{ email }, { phoneNumber }] });
  if (isUserExist) {
    throw new ApiError(400, "user already exist");
  }

  const baseQuery: Partial<IUser> = { ...req.body };
  const file = req.files as Express.Multer.File[];

  if (fullName) {
    baseQuery.fullName = `${fullName[0].toUpperCase()}${fullName.slice(1).toLowerCase()}`;
  }

  if (!avatar && file.length === 1) {
    try {
      const imagesUrl = await imageResizer(file);
      const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
      const uploadResult = (await Promise.all(uploadPromise)).filter(
        (item): item is string => typeof item === "string"
      );
      baseQuery.avatar = uploadResult[0];
    } catch (error) {
      file.map((file) => async () => await fs_extra.remove(file.path));

      throw new ApiError(500, "internal sever error while uploading image");
    }
  }

  if (!password) {
    baseQuery.password = process.env.USER_PASSWORD;
  }

  const user = await User.create(baseQuery);

  res.status(201).json(new ApiResponse(201, {}, "user created successfully"));
});

const searchUser = asyncHandler(
  async (req: Request<{}, {}, {}, searchUserQuery>, res) => {
    const { email, phone_number, sort_by, gender, role, is_verified } =
      req.query;

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Math.abs(Number(req.query.limit) || 20), 30);
    const skip = (page - 1) * limit;

    const baseQuery: searchUserBaseQuery = {};
    const sort: { [index: string]: SortOrder } = {};

    if (sort_by) {
      const [name, type] = sort_by.split("-");
      sort[name] = type === "desc" ? -1 : 1;
    }

    if (email) baseQuery.email = { $regex: email, $options: "i" };
    if (phone_number) baseQuery.phoneNumber = phone_number;
    if (gender) baseQuery.gender = gender;
    if (role) baseQuery.role = role;
    if (is_verified) baseQuery.isVerified = is_verified;

    const usersPromise = User.find(baseQuery)
      .sort(sort_by && sort)
      .skip(skip)
      .limit(limit)
      .select("-refreshToken -password -address -__v");

    const [users, count] = await Promise.all([
      usersPromise,
      User.countDocuments(baseQuery),
    ]);

    const totalPages = Math.ceil(count / limit);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pageNumber: page,
          totalPages,
          totalProducts: count,
        },
        "users fetched successfully"
      )
    );
  }
);

const logInUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "user does not exist");
  }

  if (!user.isVerified) {
    throw new ApiError(
      400,
      "Unauthorized request please verify your account first"
    );
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(400, "invalid user credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const loggedInUser = await User.findOneAndUpdate(
    user._id,
    { $set: { refreshToken } },
    { new: true }
  ).select("-refreshToken -password -address -__v");

  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, "user logged in successfully"));
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  );

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const renewAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  );

  const id: string = typeof decodedToken !== "string" && decodedToken._id;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(401, "invalid Token");
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "refresh token is expire or used");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: { refreshToken } },
    { new: true }
  ).select("-refreshToken -password -address -__v");

  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, updatedUser, "accessToken is refreshed"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const user = await User.findByIdAndDelete(id).select(
    "-refreshToken -password -address -__v"
  );

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  await deleteOnCloudinary([user.avatar]);

  res.status(200).json(new ApiResponse(200, user, "user deleted successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  res.status(200).json(new ApiResponse(200, user, "user fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const id = req.user._id;

  const baseQuery: Partial<IUser> = { ...req.body };
  const file = req.files as Express.Multer.File[];

  if (file.length === 1) {
    try {
      const imagesUrl = await imageResizer(file);
      const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
      const uploadResult = (await Promise.all(uploadPromise)).filter(
        (item): item is string => typeof item === "string"
      );
      baseQuery.avatar = uploadResult[0];
    } catch (error) {
      file.map((file) => async () => await fs_extra.remove(file.path));

      throw new ApiError(500, "internal sever error while uploading image");
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: baseQuery },
    { new: true }
  ).select("-refreshToken -password -address -__v");

  res.status(200).json(new ApiResponse(200, user, "user updated successfully"));
});

export {
  createUser,
  logOutUser,
  searchUser,
  logInUser,
  renewAccessAndRefreshToken,
  deleteUser,
  getUser,
  updateUser,
};
