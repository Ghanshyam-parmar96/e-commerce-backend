import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import fs_extra from "fs-extra";

const validate = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { data } = req.body;
      if (!data) {
        throw new ApiError(400, "data is required");
      }

      const reqBody = JSON.parse(req.body.data);
      const parseBody = schema.parse(reqBody);

      if (reqBody.color !== undefined) parseBody.color = reqBody.color;
      if (reqBody.size !== undefined) parseBody.size = reqBody.size;

      req.body = parseBody;

      next();
    } catch (err: unknown) {
      // const files = req.files as Express.Multer.File[];
      // for (let i = 0; i < files.length; i++) {
      //   fs_extra.removeSync(files[i].path);
      // }
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
