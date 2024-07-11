import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import NodeCache from "node-cache";
import connectDB from "./db/index.js";
import passport from "passport";
import { User } from "./models/user.model.js";
import { IUser } from "./types/product.type.js";
import { ApiError } from "./utils/apiError.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT || 3000;
export const myCache = new NodeCache();

app.use(
  cors({
    origin: `${process.env.FRONTEND_URI}`,
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));

// routes import
import productRoute from "./routes/product.route.js";
import couponRoute from "./routes/coupon.route.js";
import categoryRoute from "./routes/category.route.js";
import brandRoute from "./routes/brand.route.js";
import orderRoute from "./routes/order.route.js";
import userRoute from "./routes/user.route.js";
import dashboardRoute from "./routes/dashboard.route.js";

// routes declarations
app.use("/api/v1/product", productRoute);
app.use("/api/v1/coupon", couponRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/brand", brandRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/dashboard", dashboardRoute);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        let user: IUser | null = await User.findOne({
          email: profile._json.email,
        }).select("email");

        if (!user) {
          user = await User.create({
            email: profile._json.email,
            fullName: profile._json.name,
            avatar: profile._json.picture,
            isVerified: true,
            password: process.env.USER_PASSWORD,
          });
        }

        return cb(null, user._id);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URI}/auth/login`,
  }),
  async (req, res) => {
    const userId = req.user;

    const user = await User.findById(userId).select([
      "fullName",
      "email",
      "avatar",
      "isVerified",
      "isAdmin",
    ]);

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const query = new URLSearchParams({
      accessToken: accessToken,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      _id: user._id,
      isAdmin: `${user.isAdmin}`,
      isVerified: `${user.isVerified}`,
      refreshToken: refreshToken,
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.redirect(`${process.env.FRONTEND_URI}/api/v1/google?${query}`);
  }
);

// connect mongodb
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection Failed ", err);
  });
