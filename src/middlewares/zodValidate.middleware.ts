import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const validate = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parseBody = schema.parse(req.body);

      if (req.body.color !== undefined) parseBody.color = req.body.color;
      if (req.body.size !== undefined) parseBody.size = req.body.size;

      req.body = parseBody;
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const error_messages = err.errors?.map((e) => ({
          path: e.path[0],
          message: e.message,
        }));
        res
          .status(400)
          .json(new ApiResponse(400, error_messages, "invalid request"));
      } else {
        throw new ApiError(400, "Invalid fields");
      }
    }
  };
};

export default validate;
