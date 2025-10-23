import { Stay } from "../models/stayModel.js";
import { User } from "../models/userModel.js";
import { Review } from "../models/reviewModel.js";
import { Rating } from "../models/ratingModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { putObject } from "../../util/putObject.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
// import { s3Client } from "./s3-credentials.js";
// const { s3Client } = require("./s3-credentials");
// import { s3Client } from "./s3-credentials.js";
import { s3Client } from "../../util/s3-credentials.js";
// import { S3Client } from "@aws-sdk/client-s3";
import { RoomType } from "../models/roomTypeModel.js";
import { RoomTypeAvailability } from "../models/RoomTypeAvailability.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"; // Add DeleteObjectCommand import
import { Booking } from "../models/bookingModel.js";
const createStay = asyncHandler(async (req, res) => {
  const {
    title,
    state_name,
    state_id,
    city_name,
    city_id,
    pincode,
    locationUrl,
    stay_information,
    cancellation_policy,
    checkin_time,
    checkout_time,
    price,
    adults,
    children,
    special_notes,
    stayType,
    amenities,
    standoutAmenities,
    safetyItems,
  } = req.body;

  const files = req.files?.images; // Retrieve uploaded images

  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Image upload logic
    const uploadedImages = [];
    if (files) {
      const imagesArray = Array.isArray(files) ? files : [files]; // Handle single or multiple file uploads

      for (const image of imagesArray) {
        const fileName = `images/v4/${uuidv4()}_${image.name}`;
        const uploadedImage = await putObject(image, fileName); // Upload image to S3
        if (uploadedImage) {
          uploadedImages.push(uploadedImage);
        }
      }
    }

    // Create the stay in the database
    const stay = await Stay.create({
      title,
      state_name,
      state_id,
      city_name,
      city_id,
      pincode,
      locationUrl,
      stay_information,
      cancellation_policy,
      stayType, // Added stayType field
      amenities,
      standoutAmenities, // Added standoutAmenities field
      safetyItems, // Added safetyItems field
      host_information: {
        vendor_id: user._id,
      },
      price,
      checkin_time,
      checkout_time,
      adults,
      children,
      special_notes,
      images: uploadedImages, // Attach uploaded images
    });

    return res.status(200).json({
      stay,
      message: "Stay created successfully",
    });
  } catch (e) {
    console.error("Error details:", e); // Logs the full error object and stack trace
    return res
      .status(500)
      .json({ message: "Server error while creating stay", error: e.message });
  }
});




const getAllReviewsByStay = asyncHandler(async (req, res) => {
  console.log("Coming inside the get all reviews by stay function");
  try {
    const userId = req.user?._id;
    const { stayId } = req.params; // Get stayId from route parameters

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");
    console.log(user, "user details");
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if the stay exists
    const stay = await Stay.findById(stayId);
    console.log(stay, "stay details");
    if (!stay) {
      throw new ApiError(404, "Stay not found");
    }

    // Fetch all reviews for the stay and populate the user field
    const reviews = await Review.find({ stay_id: stayId }).populate({
      path: 'user_id', // Match the field name in the schema
      select: 'fullName', // Only fetch the fullName of the user
    });

    console.log("Fetched reviews:", reviews); // Debug: Log the reviews

    // If no reviews are found, return an empty array with a message
    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        reviews: [],
        message: "No reviews found for this stay",
      });
    }

    return res.status(200).json({
      reviews,
      message: "Reviews fetched successfully",
    });
  } catch (e) {
    console.error(e);
    if (e instanceof ApiError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    return res
      .status(500)
      .json({ message: "Server error while fetching reviews" });
  }
});
const getAllReviews = asyncHandler(async (req, res) => {
  console.log("7777");

  console.log("Coming inside the get all reviews function");

  try {
    // ✅ Fetch only latest 15 reviews (sorted by newest first)
    const reviews = await Review.find()
      .sort({ createdAt: -1 }) // Sort descending (latest first)
      .limit(15) // Only take 15
      .populate({
        path: "user_id",
        select: "fullName", // Fetch user's full name only
      })
      .populate({
        path: "stay_id",
        select: "title", // Optionally fetch stay title
      });

    // ✅ If no reviews found
    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reviews found",
        reviews: [],
      });
    }

    // ✅ Send success response
    return res.status(200).json({
      success: true,
      message: "Latest 15 reviews fetched successfully",
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
    });
  }
});


// module.exports = { getAllReviewsByStay };

// const getAllStays = asyncHandler(async (req, res) => {
//   console.log("coming inside the get all stays function");

//   try {
//     const userId = req.user?._id;

//     // Fetch the user from the database
//     const user = await User.findById(userId).select("-password -refreshToken");
//     console.log(user, "user details");

//     if (!user) {
//       throw new ApiError(401, "User not found");
//     }

//     let stays;

//     // If admin, fetch all stays
//     if (user.type === "admin") {
//       stays = await Stay.find({}).populate({
//         path: "host_information.vendor_id",
//         select: "fullName",
//       });
//     } else {
//       // If travelProvider or other user, fetch only their own stays
//       stays = await Stay.find({ "host_information.vendor_id": userId }).populate({
//         path: "host_information.vendor_id",
//         select: "fullName",
//       });
//     }

//     console.log("🚀 ~ stays:", stays)
//     return res.status(200).json({
//       stays,
//       message: "Stays fetched successfully",
//     });
//   } catch (e) {
//     console.log(e);
//     return res
//       .status(500)
//       .json({ message: "Server error while fetching stays" });
//   }
// });

// const getAllStays = asyncHandler(async (req, res) => {
//   console.log("coming inside the get all stays function");

//   try {
//     const userId = req.user?._id;

//     // Fetch the user from the database
//     const user = await User.findById(userId).select("-password -refreshToken");
//     console.log(user, "user details");

//     if (!user) {
//       throw new ApiError(401, "User not found");
//     }

//     let stays;
//     let pendingCount = 0;


//     // If admin, fetch all stays
//     if (user.type === "admin") {
//       stays = await Stay.find({}).populate({
//         path: "host_information.vendor_id",
//         select: "fullName",
//       });
//       // ✅ Count pending bookings for all stays
//       pendingCount = await Booking.countDocuments({ status: "pending" });
//       // console.log("🚀 ~ pendingCount:=======", pendingCount)
//     } else {
//       // If travelProvider or other user, fetch only their own stays
//       stays = await Stay.find({ "host_information.vendor_id": userId }).populate({
//         path: "host_information.vendor_id",
//         select: "fullName",
//       });
//     }

//     console.log("🚀 ~ stays:", stays)
//     return res.status(200).json({
//       count: stays.length,
//       pendingBookings: pendingCount,
//       stays,
//       message: "Stays fetched successfully",
//     });
//   } catch (e) {
//     console.log(e);
//     return res
//       .status(500)
//       .json({ message: "Server error while fetching stays" });
//   }
// });

const getAllStays = asyncHandler(async (req, res) => {
  console.log("coming inside the get all stays function");

  try {
    const userId = req.user?._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");
    console.log(user, "user details");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    let stays = [];

    if (user.type === "admin") {
      // ✅ Admin: Fetch all stays
      stays = await Stay.find({}).populate({
        path: "host_information.vendor_id",
        select: "fullName",
      });
    } else {
      // ✅ TravelProvider or other user: Fetch their owns stays
      stays = await Stay.find({
        "host_information.vendor_id": userId,
      }).populate({
        path: "host_information.vendor_id",
        select: "fullName",
      });
    }

    // ✅ Attach pending bookings count per stay
    const staysWithPending = await Promise.all(
      stays.map(async (stay) => {
        const pendingCount = await Booking.countDocuments({
          stay_id: stay._id,
          status: "pending",
        });

        return {
          ...stay.toObject(), // convert Mongoose doc to plain object
          pendingBookings: pendingCount,
        };
      })
    );
    console.log("🚀 ~ staysWithPending:====", staysWithPending)

    return res.status(200).json({
      count: staysWithPending.length,
      stays: staysWithPending,
      message: "Stays fetched successfully",
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ message: "Server error while fetching stays" });
  }
});


const getAllStays1 = asyncHandler(async (req, res) => {
  console.log("coming inside the get all stays funciton");
  try {
    const userId = req.user?._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");
    console.log(user, "user details");
    if (!user) {
      throw new ApiError(401, "user not found");
    }

    const stays = await Stay.find({}).populate({
      path: "host_information.vendor_id",
      select: "fullName",
    });

    return res.status(200).json({
      stays,
      message: "Stays fetched successfully",
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ message: "Server error while fetching stays" });
  }
});

// controllers/stayController.js (updated)


const createReview = asyncHandler(async (req, res) => {
  const { stay_id, comment, rating } = req.body;

  // ✅ Validate input
  if (!stay_id || !comment || !rating) {
    return res.status(400).json({ message: "Stay ID, comment, and rating are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(stay_id)) {
    return res.status(400).json({ message: "Invalid Stay ID" });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
  }

  if (comment.length > 1000) {
    return res.status(400).json({ message: "Comment cannot exceed 1000 characters" });
  }

  // ✅ Check if the stay exists
  const stay = await Stay.findById(stay_id);
  if (!stay) {
    return res.status(404).json({ message: "Stay not found" });
  }

  // ✅ Get the authenticated user
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // ✅ Check if the user has already reviewed this stay
  const existingReview = await Review.findOne({ stay_id, user_id: req.user._id });
  if (existingReview) {
    return res.status(400).json({ message: "You have already reviewed this stay" });
  }

  // ✅ Create the review
  const review = new Review({
    stay_id,
    stay_title: stay.title,
    user_id: req.user._id,
    user_name: user.fullName,
    comment,
    rating,
  });

  await review.save();

  // ✅ Update the overall rating in the Stay document
  const newTotalReviews = (stay.total_reviews || 0) + 1;
  const newAverageRating =
    ((stay.average_rating || 0) * (stay.total_reviews || 0) + rating) / newTotalReviews;

  stay.average_rating = Number(newAverageRating.toFixed(2));
  stay.total_reviews = newTotalReviews;
  await stay.save();

  return res.status(201).json({
    success: true,
    review,
    overallRating: {
      average_rating: stay.average_rating,
      total_reviews: stay.total_reviews,
    },
    message: "Review submitted successfully",
  });
});



const getAllStaysWithoutToken = asyncHandler(async (req, res) => {
  console.log("🔹 Inside getAllStaysWithoutToken function");
  console.log(req.query); // Log incoming query parameters to verify

  // Extract query parameters
  const { stayTypes, priceRange, amenities, state, city } = req.query;

  // Initialize the filter object
  const filter = {};

  // Check if state and city are provided, and add them to the filter
  if (state) {
    filter.state_name = state; // Match the state_name field in the database
  }

  if (city) {
    filter.city_name = city; // Match the city_name field in the database
  }

  // Parse stayTypes: Convert comma-separated string into an array
  if (stayTypes) {
    const stayTypesArray = stayTypes.split(","); // Split string by commas
    filter.stayType = { $in: stayTypesArray }; // Use $in for array match
  }

  // Parse priceRange: Convert comma-separated string into an array and convert to numbers
  if (priceRange) {
    const priceRangeArray = priceRange.split(",").map(Number); // Split and convert to numbers
    if (priceRangeArray.length === 2) {
      filter.price = { $gte: priceRangeArray[0], $lte: priceRangeArray[1] }; // Price filter
    }
  }

  // Parse amenities: Convert comma-separated string into an array
  if (amenities) {
    const amenitiesArray = amenities.split(","); // Split string by commas
    const amenitiesFilter = {
      $or: [
        { amenities: { $all: amenitiesArray } },
        { standoutAmenities: { $all: amenitiesArray } },
        { safetyItems: { $all: amenitiesArray } },
      ],
    };
    filter.$or = amenitiesFilter.$or; // Apply OR condition across the three amenity fields
  }

  // Add the featured condition to the filter
  const updatedFilter = { ...filter, featured: true };

  // Find all stay_ids that have associated room types
  const roomTypes = await RoomType.distinct("stay_id");
  console.log("🔹 Stay IDs with room types:", roomTypes);

  // Add the condition to only include stays that have room types
  updatedFilter._id = { $in: roomTypes };

  // Fetch only featured stays with room types using the updated filter
  const stays = await Stay.find(updatedFilter).populate({
    path: "host_information.vendor_id",
    select: "fullName",
  });

  return res.status(200).json({
    success: true,
    stays,
    message: "🏡 Featured stays with room types fetched successfully",
  });
});


const getStayById = asyncHandler(async (req, res) => {
  const { stayId } = req.params;

  const { page = 1, limit = 10 } = req.query;

  // ✅ Validate Stay ID
  if (!mongoose.Types.ObjectId.isValid(stayId)) {
    return res.status(400).json({
      message: "I ",
    });
  }

  try {
    // ✅ Fetch the stay by ID
    const stay = await Stay.findById(stayId)
      .populate({
        path: "host_information.vendor_id",
        select: "fullName email type createdAt", // Include necessary fields
      })
      .exec();

    if (!stay) {
      console.log("inside stay not found");
      return res.status(404).json({ message: "Stay not found" });
    }

    // ✅ Fetch room types associated with this stay
    const roomTypes = await RoomType.find({ stay_id: stayId });

    // ✅ Fetch availability for all room types
    const roomTypeIds = roomTypes.map((room) => room._id);

    const roomAvailability = await RoomTypeAvailability.find({
      room_type_id: { $in: roomTypeIds },
    }).sort({ date: 1 });

    // ✅ Group availability by room type ID
    const availabilityMap = roomAvailability.reduce((acc, item) => {
      if (!acc[item.room_type_id]) acc[item.room_type_id] = [];
      acc[item.room_type_id].push({
        date: item.date,
        available_rooms: item.available_rooms,
        price: item.price,
      });
      return acc;
    }, {});

    // ✅ Attach availability to each room type
    const enrichedRoomTypes = roomTypes.map((roomType) => ({
      ...roomType.toObject(),
      availability: availabilityMap[roomType._id] || [],
    }));

    const reviews = await Review.find({ stay_id: stayId, isEnabled: true })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .exec();

    const totalReviews = await Review.countDocuments({ stay_id: stayId });

    return res.status(200).json({
      stay,
      roomTypes: enrichedRoomTypes,
      reviews: {
        data: reviews,
        pagination: {
          totalReviews,
          currentPage: Number(page),
          totalPages: Math.ceil(totalReviews / Number(limit)),
          limit: Number(limit),
        },
      },
      overallRating: {
        average_rating: stay.average_rating || 0,
        total_reviews: stay.total_reviews || 0,
      },
      message: "Stay, room types, reviews, and rating fetched successfully",
    });
  } catch (e) {
    console.error("❌ Error fetching stay by ID:", e);
    return res.status(500).json({
      message: "Server error while fetching stay details",
      error: e.message,
    });
  }
});

const updateStay = asyncHandler(async (req, res) => {
  const { stayId } = req.params; // Assuming stayId comes from URL params
  const {
    title,
    state_name,
    state_id,
    city_name,
    city_id,
    pincode,
    locationUrl,
    stay_information,
    cancellation_policy,
    checkin_time,
    checkout_time,
    price,
    adults,
    children,
    special_notes,
    stayType,
    amenities,
    standoutAmenities,
    safetyItems,
    imagesToDelete,
  } = req.body;
  console.log(req.body, "the data coming inside the stay controller");
  const files = req.files?.images; // Retrieve uploaded images

  try {
    // Verify user
    const userId = req.user?._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Find the existing stay and verify ownership
    const stay = await Stay.findById(stayId);
    if (!stay) {
      return res.status(404).json({ message: "Stay not found" });
    }
    // if (stay.host_information.vendor_id.toString() !== userId.toString()) {
    //   return res.status(403).json({ message: "Not authorized to update this stay" });
    // }

    // Handle image deletion
    if (imagesToDelete) {
      let imagesToDeleteArray = [];
      if (typeof imagesToDelete === 'string') {
        imagesToDeleteArray = JSON.parse(imagesToDelete);
      } else if (Array.isArray(imagesToDelete)) {
        imagesToDeleteArray = imagesToDelete;
      }

      // Remove images from S3
      for (const imageKey of imagesToDeleteArray) {
        await deleteObject(imageKey); // Use the updated deleteObject function
      }
      // Filter out deleted images
      stay.images = stay.images.filter(
        (image) => !imagesToDeleteArray.includes(image.key)
      );
    }

    // Handle new image uploads
    let uploadedImages = [...stay.images];
    if (files) {
      const imagesArray = Array.isArray(files) ? files : [files];
      for (const image of imagesArray) {
        const fileName = `images/v4/${uuidv4()}_${image.name}`;
        const uploadedImage = await putObject(image, fileName);
        if (uploadedImage) {
          uploadedImages.push(uploadedImage);
        }
      }
    }

    // Prepare update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (state_name) updateData.state_name = state_name;
    if (state_id) updateData.state_id = state_id;
    if (city_name) updateData.city_name = city_name;
    if (city_id) updateData.city_id = city_id;
    if (pincode) updateData.pincode = pincode;
    if (locationUrl) updateData.locationUrl = locationUrl;
    if (stay_information) updateData.stay_information = stay_information;
    if (cancellation_policy)
      updateData.cancellation_policy = cancellation_policy;
    if (checkin_time) updateData.checkin_time = checkin_time;
    if (checkout_time) updateData.checkout_time = checkout_time;
    if (price) updateData.price = price;
    if (adults) updateData.adults = adults;
    if (children) updateData.children = children;
    if (special_notes) updateData.special_notes = special_notes;
    if (stayType) updateData.stayType = stayType;
    if (amenities) updateData.amenities = amenities;
    if (standoutAmenities) updateData.standoutAmenities = standoutAmenities;
    if (safetyItems) updateData.safetyItems = safetyItems;
    if (uploadedImages.length > 0) updateData.images = uploadedImages;
    // Update the stay
    const updatedStay = await Stay.findByIdAndUpdate(
      stayId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      stay: updatedStay,
      message: "Stay updated successfully",
    });
  } catch (e) {
    console.error("Error details:", e);
    return res
      .status(500)
      .json({ message: "Server error while updating stay", error: e.message });
  }
});

const deleteObject = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET, // Use the same variable as putObject
    Key: key,
  };
  console.log("Delete params:", params); // Debug log to verify Bucket value
  try {
    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command);

    if (data.$metadata.httpStatusCode !== 204) {
      throw new Error("Failed to delete object from S3");
    }

    console.log("Successfully deleted object with key:", key);
    return true;
  } catch (error) {
    console.error("Error deleting object from S3:", error);
    throw error;
  }
};
const deleteStay = asyncHandler(async (req, res) => {
  const { stayId } = req.params;

  if (!stayId) {
    return res.status(400).json({ message: "Stay ID is required" });
  }

  try {
    const userId = req.user?._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }

    const stay = await Stay.findById(stayId);

    if (!stay) {
      return res.status(404).json({ message: "Stay not found" });
    }

    await stay.deleteOne({ _id: stayId });

    return res.status(200).json({
      message: "Stay deleted successfully",
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ message: "Server error while deleting stay" });
  }
});

// Controllers

// Feature a stay
const featureStay = asyncHandler(async (req, res) => {
  const { stayId } = req.params;

  const stay = await Stay.findById(stayId);
  if (!stay) return res.status(404).json({ message: "Stay not found" });

  stay.featured = true; // Mark as featured
  await stay.save();

  res.status(200).json({ success: true, message: "Stay marked as featured" });
});

// Unfeature a stay
const unfeatureStay = asyncHandler(async (req, res) => {
  const { stayId } = req.params;

  const stay = await Stay.findById(stayId);
  if (!stay) return res.status(404).json({ message: "Stay not found" });

  stay.featured = false; // Unmark as featured
  await stay.save();

  res.status(200).json({ success: true, message: "Stay unmarked as featured" });
});

// Feature Toggle API
const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  const { stayId } = req.params;
  const stay = await Stay.findById(stayId);

  if (!stay) {
    return res.status(404).json({ message: "Stay not found" });
  }

  // Toggle featured status
  stay.featured = !stay.featured;

  await stay.save();

  res
    .status(200)
    .json({ success: true, message: "Stay featured status updated", stay });
});

// Backend API to fetch states and cities
const getStatesAndCities = asyncHandler(async (req, res) => {
  try {
    const statesAndCities = await Stay.aggregate([
      {
        $project: {
          state: "$state_name",
          city: "$city_name",
        },
      },
      {
        $group: {
          _id: "$state",
          cities: { $addToSet: "$city" },
        },
      },
      {
        $unwind: "$cities",
      },
      {
        $project: {
          state: "$_id",
          city: "$cities",
          _id: 0,
        },
      },
    ]);

    if (!statesAndCities) {
      return res.status(404).json({ message: "No states and cities found" });
    }

    // Send each state-city pair
    res.status(200).json({ stateCityPairs: statesAndCities });
  } catch (error) {
    console.error("Error fetching states and cities:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching states and cities" });
  }
});


const enableReview = asyncHandler(async (req, res) => {
  const stayId = req.params.stayId;
  const reviewId = req.params.reviewId;
  const userId = req.user ? req.user._id : null; // From the protect middleware

  // Fetch the user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Fetch the stay
  const stay = await Stay.findById(stayId);
  if (!stay) {
    throw new ApiError(404, "Stay not found");
  }

  // Check if the user is authorized (admin or the stay's host)
  const isAdmin = user.type === 'admin' || "travelProvider";
  const isHost = stay.host_information && stay.host_information.vendor_id && stay.host_information.vendor_id.toString() === userId.toString();
  if (!isAdmin && !isHost) {
    throw new ApiError(403, "You are not authorized to enable this review");
  }

  // Fetch the review
  const review = await Review.findById(reviewId);
  if (!review || review.stay_id.toString() !== stayId) {
    throw new ApiError(404, "Review not found");
  }

  // Update the review's isEnabled status
  review.isEnabled = true;
  await review.save();

  res.status(200).json({
    message: "Review enabled successfully",
    review: review,
  });
});

// Disable a review
const disableReview = asyncHandler(async (req, res) => {
  const stayId = req.params.stayId;
  const reviewId = req.params.reviewId;
  const userId = req.user ? req.user._id : null; // From the protect middleware

  // Fetch the user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Fetch the stay
  const stay = await Stay.findById(stayId);
  if (!stay) {
    throw new ApiError(404, "Stay not found");
  }

  // Check if the user is authorized (admin or the stay's host)
  const isAdmin = user.type === 'admin' || "travelProvider";
  const isHost = stay.host_information && stay.host_information.vendor_id && stay.host_information.vendor_id.toString() === userId.toString();
  if (!isAdmin && !isHost) {
    throw new ApiError(403, "You are not authorized to disable this review");
  }

  // Fetch the review
  const review = await Review.findById(reviewId);
  if (!review || review.stay_id.toString() !== stayId) {
    throw new ApiError(404, "Review not found");
  }

  // Update the review's isEnabled status
  review.isEnabled = false;
  await review.save();

  res.status(200).json({
    message: "Review disabled successfully",
    review: review,
  });
});



export {
  createStay,
  getAllStays,
  getStayById,
  updateStay,
  deleteStay,
  getAllStaysWithoutToken,
  featureStay,
  unfeatureStay,
  toggleFeaturedStatus,
  getStatesAndCities,
  createReview,
  getAllReviewsByStay,
  getAllReviews,
  enableReview,
  disableReview

};
