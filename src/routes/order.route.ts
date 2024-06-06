import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  searchOrder,
  updateOrder,
} from "../controllers/order.controller.js";
import zodValidate from "./../middlewares/zodValidate.middleware.js";
import { zodOrderSchema } from "../validators/zodOrder.validator.js";

const router = Router();

router.route("/new").post(zodValidate(zodOrderSchema), createOrder);

router.route("/search").get(searchOrder);

router.route("/:id").get(getOrder).put(updateOrder).delete(deleteOrder);

export default router;
