// import dotenv from "dotenv";
import dbConnect from "./db/index.js";
import express from "express";
import startSeeding from "../seeder/index.js";

import {
  authRouter,
  stayRouter,
  travelProviderRouter,
  bookingRouter,
  helperRouter,
  postRouter,
  chatRouter,
  userRouter,
  subscriptionRouter,
  userSection
} from "./routes/index.js";

// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load .env from the project root (two levels up from src)
// dotenv.config({ path: path.resolve(__dirname, "../.env") });
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from absolute path
dotenv.config({ path: "/home/ubuntu/actions-runner/_work/tripeloo_backend/tripeloo_backend/.env" });

console.log("MONGO_URI =", process.env.MONGO_URI);

import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

// dotenv.config();

const port = process.env.PORT || 3000;
console.log("process.env.PORT", process.env.PORT);

console.log("port", port);


const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//for provided any static files from node stored in public folder
app.use(express.static("public"));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Request body:", req.body);
  next();
});

// app.use((req, res, next) => {
//   console.log("Incoming Request Headers:", req.headers);
//   next();  // Pass control to the next middleware
// });

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', req.headers.origin); // Allow dynamic origin matching
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-type');
//   next();
// });

app.set("trust proxy", 1);
app.use(fileUpload());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://13.200.26.194',
        'http://13.203.32.58',
        "http://localhost:3000", // Local dev frontend
        "http://localhost:5173", // React frontend
        "http://localhost:5174",
        "http://localhost:3002",
        "http://localhost:3001",
        "https://tripeloo-user-cp1nszr0z-ravirajladhas-projects.vercel.app",
        "https://tripeloo-user.vercel.app",
        "https://tripeloo-admin-v2.ravirajladha.com",
        "https://tripeloo-admin-project.vercel.app",
        //  // Production frontend
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("🚫 Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-type"], // Allow x-user-type header
    optionsSuccessStatus: 200, // Allow preflight to succeed with status 200
  })
);

app.use(cookieParser());



//routes declaration
app.use("/api/v1/users", authRouter);
app.use("/api/v1/stay", stayRouter);
app.use("/api/v1/travel-provider", travelProviderRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/helper", helperRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat/booking", chatRouter);
app.use("/api/v1/subscription", subscriptionRouter);

app.use("/api/v1/customer", userSection)

app.use(errorHandler);
app.get('/', (req, res) => {
  res.status(200).json("K2K LIVE - 12-05-2025")
})

const startServer = async () => {
  try {
    await dbConnect();         // Wait for DB connection
    await startSeeding();      // Wait for seeding to complete

    // Start server after DB + seeding
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
    process.exit(1);
  }
};

startServer();
