import { NextFunction, Request, Response } from "express";

type RequestHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void> | void;

const asyncHandler =
  (requestHandler: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };

export default asyncHandler;
