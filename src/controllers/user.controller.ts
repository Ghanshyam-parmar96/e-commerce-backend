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
import jwt from "jsonwebtoken";
import { SortOrder } from "mongoose";
import isValidMongodbId from "../utils/isValidMongodbId.js";
import sendEmail from "../utils/sendMail.js";
import {
  forgotPasswordEmail,
  sendOtpEmailForAccountVerification,
} from "../utils/writeEmails.js";
import * as z from "zod";
import {
  zodCreateUserSchema,
  zodLoginUserSchema,
} from "../validators/zodUser.validator.js";

const createUser = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body as z.infer<typeof zodCreateUserSchema>;

  const isUserExist = await User.findOne({ email }).select("email");
  console.log(isUserExist);

  if (isUserExist) {
    throw new ApiError(400, "user already exist");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const user = await User.create({
    ...req.body,
    fullName: `${fullName[0].toUpperCase()}${fullName.slice(1).toLowerCase()}`,
    verifyCode: otp,
    verifyCodeExpire: new Date().setMinutes(new Date().getMinutes() + 15),
  });

  await sendEmail(
    user.email,
    "OTP - Verify your account",
    sendOtpEmailForAccountVerification(user.fullName, otp)
  );

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user._id,
        "Your account created successfully verify your account with OTP!"
      )
    );
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
      .select([
        "fullName",
        "email",
        "phoneNumber",
        "role",
        "avatar",
        "DOB",
        "gender",
        "isVerified",
        "isAdmin",
      ]);

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
  const { email, password } = req.body as z.infer<typeof zodLoginUserSchema>;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "invalid user credentials");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
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
  ).select(["fullName", "email", "avatar", "isVerified", "isAdmin"]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: loggedInUser?._id,
        fullName: loggedInUser?.fullName,
        avatar: loggedInUser?.avatar,
        email: loggedInUser?.email,
        isAdmin: loggedInUser?.isAdmin,
        isVerified: loggedInUser?.isVerified,
        accessToken,
        refreshToken,
      },
      "user logged in successfully"
    )
  );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $set: { refreshToken: "" } });

  res.status(200).json(new ApiResponse(200, {}, "user logged out"));
});

const renewAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const token = req.headers.cookie;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET as string
  );

  const id: string = typeof decodedToken !== "string" && decodedToken._id;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(401, "invalid Token");
  }

  if (token !== user.refreshToken) {
    throw new ApiError(401, "refresh token is expire or used");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const updatedUser = await User.findOneAndUpdate(
    user._id,
    { $set: { refreshToken } },
    { new: true }
  ).select(["fullName", "email", "avatar", "isVerified", "isAdmin"]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: updatedUser?._id,
        fullName: updatedUser?.fullName,
        avatar: updatedUser?.avatar,
        email: updatedUser?.email,
        isAdmin: updatedUser?.isAdmin,
        isVerified: updatedUser?.isVerified,
        accessToken,
        refreshToken,
      },
      "accessToken is refreshed"
    )
  );
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const user = await User.findByIdAndDelete(id).select(["email", "fullName"]);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  await deleteOnCloudinary([user.avatar]);

  res.status(200).json(new ApiResponse(200, user, "user deleted successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const id = req.userId;
  const user = await User.findById(id).select([
    "fullName",
    "email",
    "avatar",
    "DOB",
    "gender",
    "isVerified",
    "isAdmin",
  ]);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  res.status(200).json(new ApiResponse(200, user, "user fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const id = req.userId;

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

const verifyAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verifyCode } = req.body;

  isValidMongodbId(id);

  if (!verifyCode) {
    throw new ApiError(400, "verify code is required");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "user is already verified");
  }

  if (user.verifyCode !== verifyCode) {
    throw new ApiError(400, "invalid verify code");
  }

  if (user.verifyCodeExpire! < new Date()) {
    throw new ApiError(400, "verify code is expired");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isVerified: true,
        refreshToken,
      },
      $unset: {
        verifyCode: 1,
        verifyCodeExpire: 1,
      },
    },
    { new: true }
  ).select(["fullName", "email", "avatar", "isVerified", "isAdmin"]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: updatedUser?._id,
        fullName: updatedUser?.fullName,
        avatar: updatedUser?.avatar,
        email: updatedUser?.email,
        isAdmin: updatedUser?.isAdmin,
        isVerified: updatedUser?.isVerified,
        accessToken,
        refreshToken,
      },
      "user verify successfully"
    )
  );
});

const resendEmailOtp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "user is already verified");
  }

  const verifyCode = Math.floor(100000 + Math.random() * 900000);
  const verifyCodeExpire = new Date();
  verifyCodeExpire.setMinutes(verifyCodeExpire.getMinutes() + 15);

  await User.findByIdAndUpdate(id, {
    $set: {
      verifyCode,
      verifyCodeExpire,
    },
  }).select("email");

  await sendEmail(
    user.email,
    "Verify Your Account - Resend OTP",
    sendOtpEmailForAccountVerification(user.fullName, verifyCode, true)
  );

  res.status(200).json(new ApiResponse(200, {}, "successfully email send"));
});

const changePassword = asyncHandler(async (req, res) => {
  const id = req.userId;

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(id).select("-refreshToken -address -__v");

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Unauthorized request please verify your account first"
    );
  }

  const isMatch = await user.isPasswordCorrect(oldPassword);

  if (!isMatch) {
    throw new ApiError(400, "invalid user credentials");
  }

  user.password = newPassword;
  await user.save();

  const userData = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatar,
    DOB: user.DOB,
    gender: user.gender,
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
  };

  res
    .status(200)
    .json(new ApiResponse(200, userData, "password changed successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Unauthorized request please verify your account first"
    );
  }

  const resetPasswordToken = Math.floor(100000 + Math.random() * 900000);
  const resetPasswordExpire = new Date();
  resetPasswordExpire.setMinutes(resetPasswordExpire.getMinutes() + 15);

  await sendEmail(
    user.email,
    "Password Reset Request",
    forgotPasswordEmail(user.fullName, resetPasswordToken)
  );

  await User.findByIdAndUpdate(user._id, {
    $set: {
      resetPasswordToken,
      resetPasswordExpire,
    },
  }).select("email");

  res
    .status(200)
    .json(
      new ApiResponse(200, user._id, "Verify code have been send in your Email")
    );
});

const generateNewPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword, resetPasswordToken } = req.body;

  isValidMongodbId(id);

  const user = await User.findById(id).select([
    "resetPasswordToken",
    "resetPasswordExpire",
  ]);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (user.resetPasswordExpire! < new Date()) {
    throw new ApiError(400, "reset password token is expired");
  }

  if (user.resetPasswordToken! !== resetPasswordToken) {
    throw new ApiError(400, "invalid reset password token");
  }

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.password = newPassword;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, {}, "password update successfully Please login")
    );
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
  verifyAccount,
  resendEmailOtp,
  changePassword,
  forgotPassword,
  generateNewPassword,
};
