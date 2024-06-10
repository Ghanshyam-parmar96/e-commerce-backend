import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const adminOnly = asyncHandler(async (req, _, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);

  const _id: string = typeof decoded !== "string" && decoded._id;
  const isAdmin: boolean = typeof decoded !== "string" && decoded.isAdmin;

  if (!isAdmin) {
    throw new ApiError(
      401,
      "Unauthorized request only admin can access this route"
    );
  }

  req.user = { _id };

  next();
});

export default adminOnly;
