import mongoose from "mongoose";
import { ApiError } from "./apiError.js";

const isValidMongodbId = (id: string) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) throw new ApiError(400, "This id is not valid or not Found");
  return id;
};

export default isValidMongodbId;
