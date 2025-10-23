// controllers/travelProviderController.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import { putObject } from "../../util/putObject.js"; // Adjust the path as needed

// Fetch all travel providers
const getAllTravelProviders = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page param
    const limit = parseInt(req.query.limit) || 100; // Default to 100 records per page
    const skip = (page - 1) * limit;

    // Fetch users with type 'travelProvider', excluding sensitive fields
    const travelProviders = await User.find({ type: 'travelProvider' })
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit);

    // Count total travel providers for pagination
    const totalTravelProviders = await User.countDocuments({ type: 'travelProvider' });

    // Log the fetched travel providers for debugging
    console.log('Fetched Travel Providers:', travelProviders);

    res.status(200).json({
      travelProviders,
      totalTravelProviders,
      totalPages: Math.ceil(totalTravelProviders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching travel providers:", error);
    res.status(500).json({ message: "Error fetching travel providers" });
  }
});

// Get a travel provider by ID
const getTravelProviderById = asyncHandler(async (req, res) => {
  const travelProviderId = req.params.travelProviderId;
  try {
    const travelProvider = await User.findOne({ _id: travelProviderId, type: 'travelProvider' })
      .select('-password -refreshToken');
    if (!travelProvider) {
      throw new Error("Travel provider not found");
    }
    res.status(200).json({ travelProvider });
  } catch (error) {
    console.error("Error fetching travel provider by ID:", error);
    res.status(500).json({ message: "Error fetching travel provider by ID" });
  }
});

// Update a travel provider (only basic details: fullName, username, profileImage, email, password)
const updateTravelProvider = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    username,
    profileImage,
    password, // Password update
  } = req.body;

  const file = req.files?.profileImage; // Handle profile image upload

  try {
    const travelProviderId = req.params.travelProviderId; // Get the travel provider ID from URL params

    // Fetch the travel provider from the database
    const travelProvider = await User.findOne({ _id: travelProviderId, type: 'travelProvider' })
      .select('-password -refreshToken');

    if (!travelProvider) {
      return res.status(404).json({ message: "Travel provider not found" });
    }

    // Remove spaces from username and email before checking for duplicates
    const trimmedUsername = username ? username.trim().replace(/\s+/g, "") : null;
    const trimmedEmail = email ? email.trim().replace(/\s+/g, "") : null;

    // Check if the username or email are being changed and if they exist for other users
    if (trimmedUsername && trimmedUsername !== travelProvider.username) {
      const existingUserByUsername = await User.findOne({ username: trimmedUsername });
      if (existingUserByUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
    }

    if (trimmedEmail && trimmedEmail !== travelProvider.email) {
      const existingUserByEmail = await User.findOne({ email: trimmedEmail });
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    console.log('Received data:', req.body);

    // Handle image upload
    let uploadedImage = travelProvider.profileImage.length > 0 ? travelProvider.profileImage[0].url : null;
    let fileName = null;

    if (file) {
      const cleanFileName = file.name.replace(/[^\w.-]/g, "_");
      fileName = `travelProviders/${uuidv4()}_${cleanFileName}`; // Use a different folder for travel providers
      console.log("⬆️ Uploading new image:", fileName);

      const uploadedData = await putObject(file, fileName);
      uploadedImage = uploadedData.url;
    }

    // Update travel provider fields (only basic details)
    travelProvider.fullName = fullName || travelProvider.fullName;
    travelProvider.email = trimmedEmail || travelProvider.email;
    travelProvider.username = trimmedUsername || travelProvider.username;
    if (uploadedImage) {
      travelProvider.profileImage = [{ url: uploadedImage, key: fileName }];
    }

    // If password is provided, set it directly (pre-save hook will hash it)
    if (password) {
      travelProvider.password = password;
    }

    // Save the updated travel provider
    await travelProvider.save();

    res.status(200).json({
      travelProvider,
      message: "Travel provider details updated successfully",
    });
  } catch (error) {
    console.error("Error updating travel provider:", error);
    res.status(500).json({ message: "Error updating travel provider" });
  }
});

// Disable a travel provider
const disableTravelProvider = asyncHandler(async (req, res) => {
  const travelProviderId = req.params.travelProviderId;
  try {
    const travelProvider = await User.findOneAndUpdate(
      { _id: travelProviderId, type: 'travelProvider' },
      { isActive: false },
      { new: true }
    );
    if (!travelProvider) {
      throw new Error("Travel provider not found");
    }
    res.status(200).json({ message: "Travel provider disabled successfully", travelProvider });
  } catch (error) {
    console.error("Error disabling travel provider:", error);
    res.status(500).json({ message: "Error disabling travel provider" });
  }
});

// Enable a travel provider
const enableTravelProvider = asyncHandler(async (req, res) => {
  const travelProviderId = req.params.travelProviderId;
  try {
    console.log("Incoming Request Body:", req.body);

    const travelProvider = await User.findOneAndUpdate(
      { _id: travelProviderId, type: 'travelProvider' },
      { isActive: true },
      { new: true }
    );
    if (!travelProvider) {
      throw new Error("Travel provider not found");
    }
    res.status(200).json({ message: "Travel provider enabled successfully", travelProvider });
  } catch (error) {
    console.error("Error enabling travel provider:", error);
    res.status(500).json({ message: "Error enabling travel provider" });
  }
});

export {
  getAllTravelProviders,
  getTravelProviderById,
  updateTravelProvider,
  disableTravelProvider,
  enableTravelProvider,
};