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
  zodChangePasswordSchema,
  zodCreateUserSchema,
  zodGenerateNewPasswordSchema,
  zodLoginUserSchema,
  zodUserSchema,
  zodUserUpdateSchema,
} from "../validators/zodUser.validator.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import isAuthorizedUser from "../middlewares/auth.middleware.js";

const router = Router();

// user create
router.route("/new").post(zodValidate(zodCreateUserSchema), createUser);

router.route("/log-in").post(zodValidate(zodLoginUserSchema), logInUser);

router.route("/log-out").get(isAuthorizedUser, logOutUser);

router.route("/search").get(adminOnly, searchUser);

router.route("/renew-token").get(renewAccessAndRefreshToken);

router.route("/me").get(isAuthorizedUser, getUser);

router.route("/:id").delete(adminOnly, deleteUser);

router
  .route("/me/change-password")
  .post(isAuthorizedUser, zodValidate(zodChangePasswordSchema), changePassword);

router
  .route("/me/update")
  .put(
    isAuthorizedUser,
    zodValidate(zodUserUpdateSchema),
    upload.array("avatar", 1),
    updateUser
  );

router.route("/me/forgot-password").post(forgotPassword);

router
  .route("/me/generate-new-password/:id")
  .post(zodValidate(zodGenerateNewPasswordSchema), generateNewPassword);

router.route("/me/verify/:id").post(verifyAccount);

router.route("/me/resend-otp/:id").get(resendEmailOtp);

export default router;
