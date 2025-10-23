import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  console.log("🔍 Incoming Request:", {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    cookies: req.cookies,
    headers: req.headers,
  });

  try {
    // ✅ Map `type` to `userType` internally
    let userType =
      req.headers["x-user-type"] || 
      req.body.type ||  // Keep `type` for compatibility but map it
      req.query.type ||
      req.params.type ||
      req.cookies?.userType || 
      req.cookies?.type; // Support old `type` from cookies

    // ✅ Infer userType dynamically if missing
    if (!userType) {
      if (req.cookies?.accessToken_travelProvider) userType = "travelProvider";
      else if (req.cookies?.accessToken_admin) userType = "admin";
      else userType = "user"; // Default type as "user"
    }

    console.log("🔍 Detected userType in Middleware:", userType);

    if (!["travelProvider", "admin", "user"].includes(userType)) {
      throw new ApiError(400, "Invalid request: Missing or incorrect userType");
    }

    // ✅ Retrieve the correct token based on detected `userType`
    let accessToken =
      req.cookies?.[`accessToken_${userType}`] || 
      req.header("Authorization")?.replace("Bearer ", "");
      console.log("accessToken",accessToken);
      

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.log(`🔹 Access token expired for ${userType}. Attempting refresh...`);

        // ✅ Attempt to refresh the token using userType-specific refresh token
        const refreshToken = req.cookies?.[`refreshToken_${userType}`];

        if (!refreshToken) {
          throw new ApiError(401, "Session expired. Please log in again.");
        }

        try {
          const decodedRefreshToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );

          const user = await User.findById(decodedRefreshToken._id);

          
          if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid refresh token. Please log in again.");
          }

          // ✅ Generate new tokens
          const newAccessToken = user.generateAccessToken();
          const newRefreshToken = user.generateRefreshToken();

          // ✅ Save new refresh token in the database
          user.refreshToken = newRefreshToken;
          await user.save();

          console.log(`✅ Tokens refreshed successfully for ${userType}!`);

          // ✅ Set new tokens in cookies with userType-based keys
          const isProd = process.env.NODE_ENV === "production";
          res.cookie(`accessToken_${userType}`, newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            path: "/",
          });
          res.cookie(`refreshToken_${userType}`, newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            path: "/",
          });

          // ✅ Verify the newly issued access token
          decodedToken = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET);
          accessToken = newAccessToken;
        } catch (refreshError) {
          console.error(`🚨 Refresh token error for ${userType}:`, refreshError);
          throw new ApiError(401, "Session expired. Please log in again.");
        }
      } else {
        throw new ApiError(401, "Invalid access token");
      }
    }

    // ✅ Attach the user to the request
    req.user = await User.findById(decodedToken._id).select("-password -refreshToken");
    next();
  } catch (error) {
    console.error("🚨 Authentication error:", error.message);
    throw new ApiError(401, error.message || "Unauthorized");
  }
});
