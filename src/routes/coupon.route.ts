import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  getCoupons,
  updateCoupon,
} from "../controllers/coupon.controller.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import {
  zodCouponSchema,
  zodCouponUpdate,
} from "../validators/zodCoupon.validator.js";

const router = Router();

router.route("/").get(getAllCoupons);

router.route("/new").post(zodValidate(zodCouponSchema), createCoupon);

router
  .route("/:id")
  .get(getCoupons)
  .delete(deleteCoupon)
  .put(zodValidate(zodCouponUpdate), updateCoupon);

export default router;
