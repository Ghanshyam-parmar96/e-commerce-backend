import { NextFunction, Request, Response } from "express";
import { ApiError } from "./apiError.js";

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

const asyncHandler =
  (requestHandler: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          statusCode: error.statusCode,
          message: error.message,
          errors: error.errors,
          data: error.data,
        });
      } else {
        next(error);
      }
    });
  };

export default asyncHandler;
