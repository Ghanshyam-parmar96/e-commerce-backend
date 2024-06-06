import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategory,
  searchCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllCategories);

router.route("/new").post(upload.array("image", 1), createCategory);

router.route("/search").get(searchCategory);

router
  .route("/:id")
  .get(getCategory)
  .delete(deleteCategory)
  .put(upload.array("image", 1), updateCategory);

export default router;
