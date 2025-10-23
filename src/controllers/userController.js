// controllers/userController.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from "uuid";
import { putObject } from "../../util/putObject.js"; // Assuming the path is correct

// Fetch all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page param
    const limit = parseInt(req.query.limit) || 100; // Default to 10 records per page
    const skip = (page - 1) * limit;

    // Fetch users with type 'user', including all fields
    const users = await User.find({ type: 'user' })
      .skip(skip)
      .limit(limit);

    // Count total users with type 'user' for pagination
    const totalUsers = await User.countDocuments({ type: 'user' });

    // Log the fetched users for debugging
    console.log(users);

    res.status(200).json({
      users,
      totalUsers, // Total number of users in the database
      totalPages: Math.ceil(totalUsers / limit), // Calculate the total number of pages
      currentPage: page, // Current page number
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

      
// Get a user by ID
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      throw new Error("User not found");
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Error fetching user by ID" });
  }
});

//for admin
const updateUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    username,
    profileImage,
    dateofBirth,
    address,
    phoneNumber,
    aboutYou,
    location,
    gender,
    password,  // Password update
  } = req.body;

  const file = req.files?.profileImage; // Handle profile image upload

  try {
    const userId = req.params.userId;  // Get the user ID from URL params

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  // Remove spaces from username and email before checking for duplicates
  const trimmedUsername = username ? username.trim().replace(/\s+/g, "") : null;
  const trimmedEmail = email ? email.trim().replace(/\s+/g, "") : null;

  // Check if the username or email are being changed and if they exist for other users
  if (trimmedUsername && trimmedUsername !== user.username) {
    const existingUserByUsername = await User.findOne({ username: trimmedUsername });
    if (existingUserByUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }
  }

  if (trimmedEmail && trimmedEmail !== user.email) {
    const existingUserByEmail = await User.findOne({ email: trimmedEmail });
    if (existingUserByEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
  }

    console.log('Received data:', req.body);

    // Handle image upload (base64 or URL)
    let uploadedImage = user.profileImage.length > 0 ? user.profileImage[0].url : null;  // Keep the existing image if not updated
    let fileName = null; // Initialize fileName variable

    if (file) {
      const cleanFileName = file.name.replace(/[^\w.-]/g, "_"); // Clean the filename to avoid issues
      fileName = `users/${uuidv4()}_${cleanFileName}`;  // Define fileName
      console.log("⬆️ Uploading new image:", fileName);

      // Save image and get URL (using the `putObject` function to upload to S3)
      const uploadedData = await putObject(file, fileName);  // Assuming `putObject` returns {url, key}
      uploadedImage = uploadedData.url;  // Update the image URL with the full URL
    }

    // Update user fields
    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = trimmedEmail || user.email;
    user.username = trimmedUsername || user.username;
    // Update the profile image as an object inside the array with `url` and `key`
    if (uploadedImage) {
      user.profileImage = [{ url: uploadedImage, key: fileName }];  // Save as an array of objects with `url` and `key`
    }
    user.gender = gender || user.gender;
    user.dateofBirth = dateofBirth || user.dateofBirth;
    user.location = location || user.location;  // Update location
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.aboutYou = aboutYou || user.aboutYou;

    if (password) {
      user.password = password; 
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      user,
      message: "User details updated successfully",
    });
  } catch (error) {
    console.error("Error updating user from admin side:", error);
    res.status(500).json({ message: "Error updating user from admin side" });
  }
});



const updateMainUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    username,
    dateofBirth,
    address,
    phoneNumber,
    aboutYou,
    location,
    gender,
    oldPassword, // Add oldPassword for verification
    password, // New password
  } = req.body;
console.log("coming inside main user details", req.body);
  const file = req.files?.profileImage; // Handle profile image upload

  try {
    console.log("Request body:", req.body); // Log the entire request body
    console.log("Request files:", req.files);
    console.log("Old password received:", oldPassword); // Log oldPassword
    console.log("New password received:", password);

    const userId = req.user?._id; // Get the user ID from the authenticated user (not from params)

    // Fetch the user from the database (include password for verification)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove spaces from username and email before checking for duplicates
    const trimmedUsername = username ? username.trim().replace(/\s+/g, "") : null;
    const trimmedEmail = email ? email.trim().replace(/\s+/g, "") : null;

    // Check if the username or email are being changed and if they exist for other users
    if (trimmedUsername && trimmedUsername !== user.username) {
      const existingUserByUsername = await User.findOne({ username: trimmedUsername });
      if (existingUserByUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
    }

    if (trimmedEmail && trimmedEmail !== user.email) {
      const existingUserByEmail = await User.findOne({ email: trimmedEmail });
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    console.log("Received data:", req.body);

    // Handle image upload
    let uploadedImage = user.profileImage.length > 0 ? user.profileImage[0] : null;
    let fileName = null;

    if (file) {
      const cleanFileName = file.name.replace(/[^\w.-]/g, "_");
      fileName = `users/${uuidv4()}_${cleanFileName}`;
      console.log("⬆️ Uploading new image:", fileName);

      // Delete the old image from S3 if it exists
      if (uploadedImage && uploadedImage.key) {
        await deleteObject(uploadedImage.key);
      }

      // Upload the new image to S3
      const uploadedData = await putObject(file, fileName);
      uploadedImage = uploadedData;
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = trimmedEmail || user.email;
    user.username = trimmedUsername || user.username;
    user.dateofBirth = dateofBirth || user.dateofBirth;
    user.address = address || user.address;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.aboutYou = aboutYou || user.aboutYou;
    user.location = location || user.location;
    user.gender = gender || user.gender;

    // Update profile image
    if (uploadedImage) {
      user.profileImage = [{ url: uploadedImage.url, key: fileName }];
    }

   let passwordUpdated = false;
    if (password) {
      console.log("Password update requested");
      if (!oldPassword) {
        console.log("Old password not provided");
        return res.status(400).json({ message: "Old password is required to update the password" });
      }

      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      console.log("Old password match result:", isPasswordMatch);
      if (!isPasswordMatch) {
        console.log("Old password is incorrect");
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      if (password.length < 6) {
        console.log("New password too short:", password.length);
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      console.log("Updating password to new value");
      user.password = password;
      passwordUpdated = true;
    } else {
      console.log("No password update requested (password field not provided)");
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      user: user.toObject({ transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      } }),
      message: passwordUpdated
        ? "User details and password updated successfully"
        : "User details updated successfully",
    });
  } catch (error) {
    console.error("Error updating main user:", error);
    res.status(500).json({ message: "Error updating main user", error: error.message });
  }
});
// Disable a user
const disableUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    if (!user) {
      throw new Error("User not found");
    }
    res.status(200).json({ message: "User disabled successfully", user });
  } catch (error) {
    console.error("Error disabling user:", error);
    res.status(500).json({ message: "Error disabling user" });
  }
});
const enableUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  try {

    console.log("Incoming Request Body:", req.body);


    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );
    if (!user) {
      throw new Error("User not found");
    }
    res.status(200).json({ message: "User enabled successfully", user });
  } catch (error) {
    console.error("Error disabling user:", error);
    res.status(500).json({ message: "Error disabling user" });
  }
});

export { getAllUsers, getUserById, updateUser, disableUser ,enableUser,updateMainUser};
