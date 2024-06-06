import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Configure express middleware.
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//   })
// );

app.use(morgan("dev"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import productRoute from "./routes/product.route.js";
import couponRoute from "./routes/coupon.route.js";
import categoryRoute from "./routes/category.route.js";
import brandRoute from "./routes/brand.route.js";

// routes declarations
app.use("/api/v1/product", productRoute);

app.use("/api/v1/coupon", couponRoute);

app.use("/api/v1/category", categoryRoute);

app.use("/api/v1/brand", brandRoute);

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
