import { Request } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { IOrder } from "../types/product.type.js";
import { Order } from "../models/order.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import isValidMongodbId from "../utils/isValidMongodbId.js";
import { ApiError } from "../utils/apiError.js";
import { SortOrder } from "mongoose";

const createOrder = asyncHandler(async (req: Request<{}, {}, IOrder>, res) => {
  const { userId } = req.body;
  isValidMongodbId(userId);

  const order = await Order.create(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  res.status(200).json(new ApiResponse(200, order, "Order found successfully"));
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true }
  );
  if (!order) throw new ApiError(404, "Order not found");

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order updated successfully"));
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongodbId(id);

  const order = await Order.findByIdAndDelete(id);
  if (!order) throw new ApiError(404, "Order not found");

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order deleted successfully"));
});

const searchOrder = asyncHandler(
  async (
    req: Request<
      {},
      {},
      {},
      { sort_by?: string; page?: string; limit?: string }
    >,
    res
  ) => {
    const { sort_by } = req.query;
    const page = Math.abs(Number(req.query.page)) || 1;
    const limit = Math.min(Math.abs(Number(req.query.limit)), 20);
    const skip = (page - 1) * limit;

    const sort: { [key: string]: SortOrder } = {};

    if (sort_by) {
      const [name, type] = sort_by.split("-");
      sort[name] = type === "desc" ? -1 : 1;
    }

    const orders = await Order.find()
      .sort(sort_by && sort)
      .skip(skip)
      .limit(limit);

    res
      .status(200)
      .json(new ApiResponse(200, orders, "Order fetched successfully"));
  }
);

export { createOrder, getOrder, updateOrder, deleteOrder, searchOrder };
