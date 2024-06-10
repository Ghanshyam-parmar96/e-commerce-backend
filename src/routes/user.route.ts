import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  logInUser,
  logOutUser,
  renewAccessAndRefreshToken,
  searchUser,
  updateUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import zodValidate from "./../middlewares/zodValidate.middleware.js";
import {
  zodUserSchema,
  zodUserUpdateSchema,
} from "../validators/zodUser.validator.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import isAuthorizedUser from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/new")
  .post(upload.array("avatar", 1), zodValidate(zodUserSchema), createUser);

router.route("/log-in").post(logInUser);

router.route("/log-out").get(isAuthorizedUser, logOutUser);

router.route("/search").get(adminOnly, searchUser);

router.route("/renew-token").get(renewAccessAndRefreshToken);

router.route("/me").get(isAuthorizedUser, getUser);

router
  .route("/me/update")
  .put(
    isAuthorizedUser,
    upload.array("avatar", 1),
    zodValidate(zodUserUpdateSchema),
    updateUser
  );

router.route("/:id").delete(adminOnly, deleteUser);

export default router;
