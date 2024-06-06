import mongoose from "mongoose";
import { IOrder } from "../types/product.type.js";
import { number } from "zod";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user id required"],
    },
    orderItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "order itemId is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Order quantity must be greater than zero"],
          min: 1,
        },
        price: {
          type: Number,
          required: [true, "Order price must be greater than zero"],
        },
        size: {
          type: String,
        },
        color: {
          type: String,
        },
        selectedIndex: {
          type: Number,
        },
      },
    ],
    shippingAddress: {
      address: {
        type: String,
        required: [true, "Order address must be a valid order address"],
      },
      city: {
        type: String,
        required: [true, "Order city must be a valid order city"],
      },
      state: {
        type: String,
        required: [true, "Order state must be a valid order state"],
      },
      pinCode: {
        type: String,
        required: [true, "Order pin code must be a valid order pin code"],
      },
      country: {
        type: String,
        required: [true, "Order country must be a valid order country"],
      },
    },
    subtotal: {
      type: Number,
      required: [true, "subTotal is required"],
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingCharges: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, "Total Amount is "],
    },
    paymentMethod: {
      type: String,
      uppercase: true,
      enum: ["COD", "UPI", "CARD", "NET BANKING"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Not Processed",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
      ],
      default: "Processing",
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
