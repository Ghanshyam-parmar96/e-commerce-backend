import { Request } from "express";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const isAuthorizedUser = asyncHandler(async (req: Request, _, next) => {
  const token = req.headers.cookie;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
  const _id: string = typeof decoded !== "string" && decoded._id;

  req.userId = _id;
  next();
});

export default isAuthorizedUser;
