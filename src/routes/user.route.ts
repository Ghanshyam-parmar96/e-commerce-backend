import { Router } from "express";
import {
  changePassword,
  createUser,
  deleteUser,
  forgotPassword,
  generateNewPassword,
  getUser,
  logInUser,
  logOutUser,
  renewAccessAndRefreshToken,
  resendEmailOtp,
  searchUser,
  updateUser,
  verifyAccount,
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

router.route("/me/change-password").get(isAuthorizedUser, changePassword);

router.route("/me/forgot-password").get(forgotPassword);

router.route("/me/generate-new-password/:id").get(generateNewPassword);

router.route("/me/verify/:id").get(verifyAccount);

router.route("/me/resend-otp/:id").get(resendEmailOtp);

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
