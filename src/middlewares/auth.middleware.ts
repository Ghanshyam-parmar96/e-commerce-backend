import { Request } from "express";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const isAuthorizedUser = asyncHandler(async (req: Request, _, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded: string | jwt.JwtPayload = jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string
  );

  const _id: string = typeof decoded !== "string" && decoded._id;
  req.user = { _id };

  next();
});

export default isAuthorizedUser;
