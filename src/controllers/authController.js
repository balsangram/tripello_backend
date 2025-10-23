import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

import Joi from "joi";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    console.log("Finding user by ID:", userId);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    console.log("Generating access token");
    const accessToken = user.generateAccessToken();

    console.log("Generating refresh token");
    const refreshToken = user.generateRefreshToken();

    console.log("Saving refresh token to user document");
    user.refreshTokens.push(refreshToken); // Push new refresh token
    await user.save({ validateBeforeSave: false });

    console.log("Tokens generated and saved successfully");
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessAndRefreshTokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

// const registerUser = asyncHandler(async (req, res) => {
//   console.log(req.body, "body");

//   const { fullName, email, username, password, type  } = req.body;
//   console.log("fullName", fullName);
//   console.log("email", email);



//   // Ensure all fields are filled
//   if (
//     [fullName, email, username, password, type].some((field) => !field?.trim())
//   ) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   // Prevent direct registration as Admin
//   if (type === "admin") {
//     return res
//       .status(403)
//       .json({ message: "Admins cannot register themselves." });
//   }

//   // Check if the user already exists
//   const existingUser = await User.findOne({
//     $or: [{ username: username.toLowerCase() }, { email }],
//   });

//   if (existingUser) {
//     const message =
//       existingUser.username === username.toLowerCase()
//         ? "Username already exists"
//         : "Email already exists";
//     return res.status(409).json({ message }); // Send error message for frontend to display
//   }

//   // Create the user with the specified type (Travel Provider or User)
//   const user = await User.create({
//     fullName,
//     email,
//     password,
//     username: username.toLowerCase(),
//     type, // Travel Provider or User
//   });

//   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
//     user._id,
//     user.type
//   );

//   const isProduction = process.env.NODE_ENV === "production";
//   const options = {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "None" : "Lax",
//     path: "/",
//   };

//   return res
//     .status(201)
//     .cookie(`accessToken_${type}`, accessToken, options)
//     .cookie(`refreshToken_${type}`, refreshToken, options)
//     .json({
//       data: {
//         user: { fullName, email, username, type },
//         accessToken,
//         refreshToken,
//       },
//       message: "User registered and logged in successfully",
//     });
// });


// const loginUser = asyncHandler(async (req, res, next) => {
//   console.log("hello");

//   console.log("🔹 Login Request Received", req.body);

//   // Validate input using Joi
//   const loginSchema = Joi.object({
//     email: Joi.string().email(),
//     username: Joi.string(),
//     password: Joi.string().required(),
//     type: Joi.string().valid("travelProvider", "admin", "user").required(), // Ensure type is provided
//   }).or("email", "username"); // Use `.or` instead of `.xor`

//   const { error } = loginSchema.validate(req.body);
//   if (error) {
//     console.error("❌ Validation Error:", error.details);
//     return next(error);
//   }

//   const { email, username, password, type } = req.body;

//   // Ensure only the correct type of user logs in
//   console.log("🔍 Searching for user:", { email, username, type });

//   const user = await User.findOne({
//     $and: [
//       { $or: [{ username }, { email }] }, // Find user by email OR username
//       { type }, // Ensure correct type
//     ],
//   });

//   if (!user) {
//     console.warn("⚠️ User Not Found or Incorrect Type:", { email, username, type });
//     return next({
//       message: "User does not exist or incorrect type",
//       status: 404,
//     });
//   }

//   console.log("✅ User Found:", user.username);

//   if (!user.isActive) {
//     console.warn("⚠️ Inactive User Attempted Login:", user.username);
//     return next({
//       message: "Your account is inactive. Please contact support to activate your account.",
//       status: 403,
//     });
//   }

//   // Verify Password
//   const isPasswordValid = await user.isPasswordCorrect(password);
//   if (!isPasswordValid) {
//     console.warn("⚠️ Invalid Password Attempt for:", user.username);
//     return next({ message: "Invalid password, try again!", status: 400 });
//   }

//   // Generate Tokens
//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   console.log("🔑 Tokens Generated Successfully");

//   // Store only the latest refresh token (as array)
//   user.refreshTokens = Array.isArray(user.refreshTokens)
//     ? [...user.refreshTokens.filter((t) => t !== refreshToken), refreshToken]
//     : [refreshToken];
//   await user.save();
//   console.log("✅ Refresh Token Stored in DB");
//   const isProduction = process.env.NODE_ENV === "production";

//   // Set Secure Cookie Options
//   const options = {
//     httpOnly: true,  // Prevents access via JavaScript
//     secure: isProduction,  // Only true in production (HTTPS)
//     sameSite: isProduction ? "none" : "lax", // Ensures correct domain
//     path: "/",  // Cookie accessible across the entire domain
//     maxAge: 7 * 24 * 60 * 60 * 1000,  // Cookie expiration set for 7 days
//     // domain: isProduction ? ".ravirajladha.com" : undefined, // Ensures correct domain
//   };



//   console.log("🍪 Setting Cookies with Options:", options);



//   return res
//     .status(200)
//     .cookie(`accessToken_${type}`, accessToken, options)
//     .cookie(`refreshToken_${type}`, refreshToken, options)
//     .json({
//       success: true,
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         fullName: user.fullName,
//         type: user.type,
//       },
//       accessToken,
//       refreshToken, // ✅ Returning refreshToken in response
//     });
// });


// const asyncHandler = require('express-async-handler');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

const registerUser = asyncHandler(async (req, res) => {
  console.log(req.body, "body");

  const { fullName, email, username, password, type, phoneNumber, gender } = req.body;

  // Ensure all required fields are filled
  if ([fullName, email, username, password, type].some((field) => !field?.trim())) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  // Prevent direct registration as Admin
  if (type === "admin") {
    return res.status(403).json({ message: "Admins cannot register themselves." });
  }

  // Check if the user already exists
  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existingUser) {
    const message =
      existingUser.username === username.toLowerCase()
        ? "Username already exists"
        : "Email already exists";
    return res.status(409).json({ message });
  }

  // Create user (optional fields added)
  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    type,
    phoneNumber: phoneNumber || null,
    gender: gender || "Other", // default fallback
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
    user.type
  );

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
  };

  return res
    .status(201)
    .cookie(`accessToken_${type}`, accessToken, options)
    .cookie(`refreshToken_${type}`, refreshToken, options)
    .json({
      data: {
        user: {
          fullName,
          email,
          username,
          type,
          phoneNumber: user.phoneNumber,
          gender: user.gender,
        },
        accessToken,
        refreshToken,
      },
      message: "User registered and logged in successfully",
    });
});

const loginUser = asyncHandler(async (req, res, next) => {
  console.log("🔹 Login Request Received", req.body);

  // ✅ Updated validation — no type required
  const loginSchema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string(),
    password: Joi.string().required(),
  }).or("email", "username");

  const { error } = loginSchema.validate(req.body);
  if (error) {
    console.error("❌ Validation Error:", error.details);
    return next(error);
  }

  const { email, username, password, type } = req.body;

  console.log("🔍 Searching for user:", { email, username });

  // ✅ Find user WITHOUT checking type
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    console.warn("⚠️ User Not Found:", { email, username });
    return next({
      message: "User does not exist",
      status: 404,
    });
  }

  console.log("✅ User Found:", user.username);

  if (!user.isActive) {
    return next({
      message: "Your account is inactive. Please contact support to activate your account.",
      status: 403,
    });
  }

  // ✅ Verify password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    return next({ message: "Invalid password, try again!", status: 400 });
  }

  // ✅ Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  console.log("🔑 Tokens Generated Successfully");

  // ✅ Save refresh token
  user.refreshTokens = Array.isArray(user.refreshTokens)
    ? [...user.refreshTokens.filter((t) => t !== refreshToken), refreshToken]
    : [refreshToken];
  await user.save();

  console.log("✅ Refresh Token Stored in DB");

  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    // httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  console.log("🍪 Setting Cookies with Options:", options);

  return res
    .status(200)
    .cookie(`accessToken_${user.type}`, accessToken, options)
    .cookie(`refreshToken_${user.type}`, refreshToken, options)
    .json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        type: user.type, // ✅ auto returned
      },
      accessToken,
      refreshToken,
    });
});


const refreshToken = asyncHandler(async (req, res) => {
  // Get the user type from the request body
  const { type } = req.body;
  if (!type || !['user', 'travelProvider', 'admin'].includes(type)) {
    return res.status(400).json({ message: "User type is required and must be 'user', 'travelProvider', or 'admin'" });
  }

  // Try to get the refresh token from cookies, request body, or Authorization header
  let refreshToken = req.cookies?.[`refreshToken_${type}`]; // Look for the correct cookie based on type

  if (!refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.split(' ')[1];
    }
  }

  if (!refreshToken) {
    console.error(`No refresh token provided for type: ${type}`);
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("Decoded refresh token:", decoded);

    // Find user by ID
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      console.error("User not found for ID:", decoded._id);
      return res.status(403).json({ message: "User not found" });
    }

    // Verify the user type matches
    if (user.type !== type) {
      console.error(`User type mismatch: expected ${type}, got ${user.type}`);
      return res.status(403).json({ message: "Invalid user type for this refresh token" });
    }

    // Check if the refresh token exists in the user's refreshTokens array
    if (!user.refreshTokens.includes(refreshToken)) {
      console.error("Stored refresh token does not match provided token");
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Remove expired tokens from the refreshTokens array
    user.refreshTokens = user.refreshTokens.filter((token) => {
      try {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return true;
      } catch (error) {
        return false;
      }
    });

    // Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Replace the old refresh token with the new one
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);

    await user.save();

    const isProduction = process.env.NODE_ENV === "production";

    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set the new tokens as cookies with the correct names
    res.cookie(`accessToken_${type}`, newAccessToken, options);
    res.cookie(`refreshToken_${type}`, newRefreshToken, options);

    // Send the new access token and refresh token in the response body
    res.json({
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Error in refreshToken handler:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// module.exports = { refreshToken };

//unauthorized
const refreshToken1 = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken; // Use cookies to retrieve the refresh token

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("Decoded refresh token:", decoded);

    // Find user by ID
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      console.error("User not found for ID:", decoded._id);
      return res.status(403).json({ message: "User not found" });
    }

    // Check if the refresh token exists in the user's refreshTokens array
    if (!user.refreshTokens.includes(refreshToken)) {
      console.error("Stored refresh token does not match cookie token");
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Remove expired tokens
    user.refreshTokens = user.refreshTokens.filter(token => {
      try {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET); // Check if the token is valid
        return true;
      } catch (error) {
        return false; // Remove expired token
      }
    });

    // Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Add the new refresh token to the user's refreshTokens array
    user.refreshTokens.push(newRefreshToken);

    await user.save();

    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
    const maxAge = refreshTokenExpiry
      ? parseInt(refreshTokenExpiry.replace("s", "")) * 1000
      : 7 * 24 * 60 * 60 * 1000;

    // Send the new refresh token as an HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true, // Prevent access via JavaScript
      // sameSite: "strict", 
      sameSite: "None",
      maxAge: maxAge, // Use REFRESH_TOKEN_EXPIRY from .env file
    });

    // Send the new access token in the response body
    res.json({
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error in refreshToken handler:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});



const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch all posts by the user
    const posts = await Post.find({ user: userId, status: "approved" })
      .populate("likes", "fullName email") // Populate users who liked the post
      .populate({
        path: "comments",
        populate: {
          path: "user_id",
          select: "fullName email",
        },
      }) // Populate comments and the user who made each comment
      .sort({ createdAt: -1 }); // Sort by creation date (newest first)

    console.log("from get userdetails", { user, posts });

    // Send back user details and their posts
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
      posts,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
});

const getUserDetails1 = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken -refreshTokens");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log("from get userdetails", user);
    // Send back user details without sensitive information
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    console.log("🔹 Incoming Logout Request:", req.body);

    const { type } = req.body;
    const refreshToken =
      req.cookies?.[`refreshToken_${type}`] || req.cookies?.refreshToken;

    if (!type || !["travelProvider", "admin", "user"].includes(type)) {
      return res.status(400).json({ message: "Invalid logout request: Missing or incorrect type" });
    }

    if (!refreshToken) {
      console.log("🚨 No refresh token found. Logging out without DB update.");
      return res
        .status(200)
        .clearCookie(`accessToken_${type}`, { path: "/" })
        .clearCookie(`refreshToken_${type}`, { path: "/" })
        .json({ message: `${type} logged out successfully` });
    }

    // Find the user by refresh token
    const user = await User.findOne({ refreshTokens: { $in: [refreshToken] } });
    if (!user) {
      console.log("🚨 No user found with this refresh token. Logging out.");
      return res
        .status(200)
        .clearCookie(`accessToken_${type}`, { path: "/" })
        .clearCookie(`refreshToken_${type}`, { path: "/" })
        .json({ message: `${type} logged out successfully` });
    }

    // Remove refresh token from DB
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    await user.save();
    console.log(`✅ User ${type} logged out successfully.`);

    return res
      .status(200)
      .clearCookie(`accessToken_${type}`, { path: "/" })
      .clearCookie(`refreshToken_${type}`, { path: "/" })
      .json({ message: `${type} logged out successfully` });

  } catch (error) {
    console.error("🚨 Logout error:", error);

    return res
      .status(200)
      .clearCookie("accessToken_travelProvider", { path: "/" })
      .clearCookie("refreshToken_travelProvider", { path: "/" })
      .clearCookie("accessToken_admin", { path: "/" })
      .clearCookie("refreshToken_admin", { path: "/" })
      .json({ message: "User session cleared despite errors." });
  }
});



const updateUserDetails = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    username,
    profileImage,
    gender,
    dateofBirth,
    address,
    phoneNumber,
    aboutYou,
  } = req.body;

  try {
    const userId = req.user?._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Only update the fields that are provided in the request body
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (profileImage) user.profileImage = profileImage;
    if (gender) user.gender = gender;
    if (dateofBirth) user.dateofBirth = dateofBirth;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (aboutYou) user.aboutYou = aboutYou;

    await user.save();
    console.log("from update userdetails", user);

    return res.status(200).json({
      user,
      message: "User details updated successfully",
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return res.status(500).json({ message: "Error fetching user by ID" });
  }
});


export {
  registerUser,
  refreshToken,
  loginUser,
  logoutUser,
  getUserDetails,
  getUserById,
  updateUserDetails,
  // refreshAccessToken,
};
