import { Router } from "express";
import {
  createProduct,
  deleteAllProducts,
} from "../controllers/product.controller.js";
import { zodProductSchema } from "../validators/product.validator.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";

const router = Router();

// create new product
router.route("/new").post(zodValidate(zodProductSchema), createProduct);

// delete all products
router.route("/delete/all").delete(deleteAllProducts);

export default router;
