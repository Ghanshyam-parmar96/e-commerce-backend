import { Router } from "express";
import {
  createProduct,
  deleteAllProducts,
  getAllProducts,
} from "../controllers/product.controller.js";
import { zodProductSchema } from "../validators/zodProduct.validator.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { productImageResizer } from "../middlewares/imageResizer.js";

const router = Router();

// create new product
router
  .route("/new")
  .post(upload.none(), zodValidate(zodProductSchema), createProduct);

router
  .route("/image")
  .post(upload.array("image", 5), productImageResizer, async (req, res) => {
    console.log(req.files);
    console.log(req.body);
    res.status(200).json({ ...req.body, image: req.files });
  });

router.route("/").get(getAllProducts);
// delete all products
router.route("/delete/all").delete(deleteAllProducts);

export default router;
