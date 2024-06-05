import { Router } from "express";
import {
  createProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  deleteAllProducts,
  getLatestProducts,
  getAllCategories,
  searchAllProducts,
  updateProductImage,
  addProductImage,
  deleteProductImage,
} from "../controllers/product.controller.js";
import {
  zodProductSchema,
  zodUpdateProductSchema,
} from "../validators/zodProduct.validator.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// create new product
router
  .route("/new")
  .post(upload.array("image", 5), zodValidate(zodProductSchema), createProduct);

// search product by filter
router.route("/search").get(searchAllProducts);

// get all categories
router.route("/categories").get(getAllCategories);

// get latest products
router.route("/latest").get(getLatestProducts);

// get product by id
router.route("/:id").get(getProduct);

//    ******************************** Admin routes ********************************

// get all products
router.route("/all/list").get(getAllProducts);

// delete all products
router.route("/delete/all").delete(deleteAllProducts);

router
  .route("/:id")
  .delete(deleteProduct)
  .put(zodValidate(zodUpdateProductSchema), updateProduct);

router
  .route("/add-product-image/:id")
  .put(upload.array("image", 3), addProductImage);

router
  .route("/product-image/:id/:imageIndex")
  .put(upload.array("image", 5), updateProductImage)
  .delete(deleteProductImage);

export default router;
