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
} from "../controllers/product.controller.js";
import { zodProductSchema } from "../validators/zodProduct.validator.js";
import zodValidate from "../middlewares/zodValidate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { productImageResizer } from "../middlewares/imageResizer.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import imageResizer from "../utils/imageResizer.js";

const router = Router();

// create new product
router
  .route("/new")
  .post(
    upload.fields([{ name: "image", maxCount: 5 }, { name: "colorImage" }]),
    zodValidate(zodProductSchema),
    createProduct
  );

/*
router.route("/image").post(
  upload.array("image", 5),
  // upload.fields([{ name: "image", maxCount: 5 }, { name: "colorImage" }]),
  // zodValidate(zodProductSchema),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    // const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // console.log("files ---> ", files, "<---- files");
    const imagesUrl = await imageResizer(files);
    const uploadPromise = imagesUrl.map((image) => uploadOnCloudinary(image));
    const uploadResult = await Promise.all(uploadPromise);

    console.log("upload result is ", uploadResult);

    console.log(req.body);
    console.log("req.files", req.files);
    // console.log("colorImage", colorImages);
    // const cloudRes = await uploadOnCloudinary(files && files[0]?.path);
    // console.log("product route", cloudRes);

    res.status(200).json("success");
  }
);
*/

// search product by filter
router.route("/search").get(searchAllProducts);

// get all categories
router.route("/categories").get(getAllCategories);

// get latest products
router.route("/latest").get(getLatestProducts);

// get product by id
router.route("/:id").get(getProduct);

//    ******************************** Admin routes ********************************

router.route("/:id").delete(deleteProduct).put(updateProduct);

// get all products
router.route("/all/list").get(getAllProducts);

// delete all products
router.route("/delete/all").delete(deleteAllProducts);

export default router;
