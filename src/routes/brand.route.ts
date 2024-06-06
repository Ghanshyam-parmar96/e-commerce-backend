import { Router } from "express";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrand,
  searchBrand,
  updateBrand,
} from "../controllers/brand.controller.js";

const router = Router();

router.route("/").get(getAllBrands);
router.route("/new").post(createBrand);
router.route("/search").get(searchBrand);
router.route("/:id").get(getBrand).put(updateBrand).delete(deleteBrand);

export default router;
