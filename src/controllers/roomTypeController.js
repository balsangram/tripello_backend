import { RoomType } from "../models/roomTypeModel.js"; // Import RoomType model
import { Stay } from "../models/stayModel.js"; // Import Stay model
import { User } from "../models/userModel.js"; // Import User model
import { Review } from "../models/reviewModel.js"; // Import User model

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { putObject } from "../../util/putObject.js"; 
import { RoomTypeAvailability } from "../models/RoomTypeAvailability.js";

import { v4 as uuidv4 } from "uuid";




import {s3Client} from "../../util/s3-credentials.js";
import { DeleteObjectCommand } from '@aws-sdk/client-s3';




const createRoomType = asyncHandler(async (req, res) => {
  console.log("\n=== 📩 Incoming Room Type Creation Request ===");
  console.log("➡️  Request Headers:", req.headers);
  console.log("➡️  Request Params:", req.params);
  console.log("➡️  Request Body:", req.body);
  console.log("➡️  Request Files:", req.files);

  const { title, description, max_adults, max_children, price_per_night, availability,beds, baths, bedrooms } = req.body;
  const { stayId } = req.params; 
  const files = req.files?.images;

  console.log("📢 Processing createRoomType...");

  try {
    // Ensure stayId is valid
    if (!mongoose.Types.ObjectId.isValid(stayId)) {
      console.error("❌ Invalid Stay ID:", stayId);
      return res.status(400).json({ message: "Invalid stay ID format" });
    }

    // Validate User
    const userId = req.user?._id;
    console.log("🔍 Extracted User ID:", userId);

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      console.error("❌ User not found in DB");
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User Found:", user.fullName);

    // Validate Stay
    const stay = await Stay.findById(stayId);
    if (!stay) {
      console.error("❌ Stay not found in DB");
      return res.status(404).json({ message: "Stay not found" });
    }

    console.log("🏨 Stay Found:", stay.title);

    // Handle file uploads
    const uploadedImages = [];
    if (files) {
      const imagesArray = Array.isArray(files) ? files : [files];

      console.log("📸 Received Images for Upload:", imagesArray.length);

      for (const image of imagesArray) {
        console.log("Uploading image:", image);
        console.log("📂 Temp File Path:", image.tempFilePath);
        console.log("📏 File Size:", image.size);
        console.log("🖼 MIME Type:", image.mimetype);

        if (!image.data) {
          console.error("❌ File data is missing");
          throw new Error("File data is missing or undefined.");
        }

        const cleanFileName = image.name.replace(/[^\w.-]/g, "_"); 
        const fileName = `images/v4/${uuidv4()}_${cleanFileName}`;

        console.log("⬆️  Uploading image with filename:", fileName);

        try {
          const uploadedImage = await putObject(image, fileName);
          if (uploadedImage) {
            uploadedImages.push(uploadedImage);
          }
        } catch (err) {
          console.error("❌ Error uploading image:", err);
        }
      }
    } else {
      console.warn("⚠️ No images found in request");
    }

    // Create Room Type
    console.log("🛏 Creating Room Type in DB...");
    const roomType = await RoomType.create({
      stay_id: stayId,
      title,
      description,
      max_adults,
      max_children,
      price_per_night,
      availability,
      beds, baths, bedrooms,
      images: uploadedImages,
    });

    console.log("✅ Room Type Created Successfully:", roomType._id);

    return res.status(200).json({
      roomType,
      message: "Room type created successfully",
    });

  } catch (e) {
    console.error("❌ Error Details:", e);
    return res.status(500).json({
      message: "Server error while creating room type",
      error: e.message,
    });
  }
});


// Get all room types
// const getAllRoomTypes = asyncHandler(async (req, res) => {
//   console.log("coming inside getallroom");
//   const roomTypes = await RoomType.find();
//   res.status(200).json({ success: true, data: roomTypes });
// });

// Get all room types for a specific stay
const getAllRoomTypes = asyncHandler(async (req, res) => {
  console.log("Fetching room types for stay_id:", req.params.stayId);

  // Retrieve the stayId from the URL params
  const { stayId } = req.params;

  // Find room types specific to the stayId
  const roomTypes = await RoomType.find({ stay_id: stayId });

  if (!roomTypes.length) {
    return res.status(404).json({ message: "No room types found for this stay" });
  }

  res.status(200).json({ success: true, data: roomTypes });
});




// Create a new room type

// Get a room type by ID
const getRoomTypeById1 = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;

  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    return res
      .status(404)
      .json({ success: false, message: "Room type not found" });
  }

  res.status(200).json({ success: true, data: roomType });
});

const getRoomTypeById = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;

  // Validate roomTypeId
  if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
    return res.status(400).json({ success: false, message: "Invalid room type ID format" });
  }

  // Fetch the room type
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    return res.status(404).json({ success: false, message: "Room type not found" });
  }

  // Fetch the associated stay using the stay_id from the room type
  const stay = await Stay.findById(roomType.stay_id);
  if (!stay) {
    return res.status(404).json({ success: false, message: "Associated stay not found" });
  }

  // Fetch reviews for the stay and calculate the overall rating
  const reviews = await Review.find({ stay_id: roomType.stay_id });
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  // Return the room type and the stay's overall rating
  res.status(200).json({
    success: true,
    data: {
      roomType,
      overallRating: {
        average_rating: averageRating,
        total_reviews: totalReviews,
      },
    },
  });
});

// Delete object from S3
const deleteObject = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  };
  console.log('Delete params:', params);
  try {
    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command);

    if (data.$metadata.httpStatusCode !== 204) {
      throw new Error('Failed to delete object from S3');
    }

    console.log('Successfully deleted object with key:', key);
    return true;
  } catch (error) {
    console.error('Error deleting object from S3:', error);
    throw error;
  }
};

const updateRoomType = asyncHandler(async (req, res) => {
  console.log('\n=== 📩 Incoming Room Type Update Request ===');
  console.log('➡️  Request Headers:', req.headers);
  console.log('➡️  Request Params:', req.params);
  console.log('➡️  Request Body:', req.body);
  console.log('➡️  Request Files:', req.files);

  const { stayId, roomTypeId } = req.params;
  const {
    title,
    description,
    max_adults,
    max_children,
    price_per_night,
    availability,
    beds,
    bedrooms,
    baths,

    imagesToDelete,
  } = req.body;
  const files = req.files?.images;

  console.log('📢 Processing updateRoomType...');

  try {
    // Validate stayId and roomTypeId
    if (!mongoose.Types.ObjectId.isValid(stayId)) {
      console.error('❌ Invalid Stay ID:', stayId);
      return res.status(400).json({ message: 'Invalid stay ID format' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
      console.error('❌ Invalid Room Type ID:', roomTypeId);
      return res.status(400).json({ message: 'Invalid room type ID format' });
    }

    // Validate User
    const userId = req.user?._id;
    console.log('🔍 Extracted User ID:', userId);

    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      console.error('❌ User not found in DB');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('✅ User Found:', user.fullName);

    // Validate Stay
    const stay = await Stay.findById(stayId);
    if (!stay) {
      console.error('❌ Stay not found in DB');
      return res.status(404).json({ message: 'Stay not found' });
    }

    console.log('🏨 Stay Found:', stay.title);

    // Validate Room Type
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      console.error('❌ Room Type not found in DB');
      return res.status(404).json({ message: 'Room type not found' });
    }

    if (roomType.stay_id.toString() !== stayId) {
      console.error('❌ Room Type does not belong to this Stay');
      return res.status(400).json({ message: 'Room type does not belong to this stay' });
    }

    // if (stay.host_information.vendor_id.toString() !== userId.toString()) {
    //   console.error('❌ Not authorized to update this room type');
    //   return res.status(403).json({ message: 'Not authorized to update this room type' });
    // }

    console.log('🛏 Room Type Found:', roomType.title);

    // Handle image deletion
    if (imagesToDelete) {
      const imagesToDeleteArray = Array.isArray(imagesToDelete) ? imagesToDelete : JSON.parse(imagesToDelete);
      for (const imageKey of imagesToDeleteArray) {
        await deleteObject(imageKey);
      }
      roomType.images = roomType.images.filter((image) => !imagesToDeleteArray.includes(image.key));
    }

    // Handle new image uploads
    let uploadedImages = [...roomType.images];
    if (files) {
      const imagesArray = Array.isArray(files) ? files : [files];
      console.log('📸 Received Images for Upload:', imagesArray.length);

      for (const image of imagesArray) {
        console.log('Uploading image:', image);
        console.log('📂 Temp File Path:', image.tempFilePath);
        console.log('📏 File Size:', image.size);
        console.log('🖼 MIME Type:', image.mimetype);

        if (!image.data) {
          console.error('❌ File data is missing');
          throw new Error('File data is missing or undefined.');
        }

        const cleanFileName = image.name.replace(/[^\w.-]/g, '_');
        const fileName = `images/v4/${uuidv4()}_${cleanFileName}`;

        console.log('⬆️  Uploading image with filename:', fileName);

        try {
          const uploadedImage = await putObject(image, fileName);
          if (uploadedImage) {
            uploadedImages.push(uploadedImage);
          }
        } catch (err) {
          console.error('❌ Error uploading image:', err);
        }
      }
    } else {
      console.warn('⚠️ No new images found in request');
    }

  // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (max_adults) {
      if (isNaN(max_adults)) {
        return res.status(400).json({ message: "max_adults must be a valid number" });
      }
      updateData.max_adults = Number(max_adults);
    }
    if (max_children) {
      if (isNaN(max_children)) {
        return res.status(400).json({ message: "max_children must be a valid number" });
      }
      updateData.max_children = Number(max_children);
    }
    if (price_per_night) {
      if (isNaN(price_per_night)) {
        return res.status(400).json({ message: "price_per_night must be a valid number" });
      }
      updateData.price_per_night = Number(price_per_night);
    }
    if (availability) {
      if (isNaN(availability)) {
        return res.status(400).json({ message: "availability must be a valid number" });
      }
      updateData.availability = Number(availability);
    }
    if (beds) {
      if (isNaN(beds)) {
        return res.status(400).json({ message: "beds must be a valid number" });
      }
      updateData.beds = Number(beds);
    }
    if (bedrooms) {
      if (isNaN(bedrooms)) {
        return res.status(400).json({ message: "bedrooms must be a valid number" });
      }
      updateData.bedrooms = Number(bedrooms);
    }
    if (baths) {
      if (isNaN(baths)) {
        return res.status(400).json({ message: "baths must be a valid number" });
      }
      updateData.baths = Number(baths);
    }
    if (uploadedImages.length > 0) updateData.images = uploadedImages;

    // Update Room Type
    console.log('🛏 Updating Room Type in DB...');
    const updatedRoomType = await RoomType.findByIdAndUpdate(
      roomTypeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('✅ Room Type Updated Successfully:', updatedRoomType._id);

    return res.status(200).json({
      roomType: updatedRoomType,
      message: 'Room type updated successfully',
    });
  } catch (e) {
    console.error('❌ Error Details:', e);
    return res.status(500).json({
      message: 'Server error while updating room type',
      error: e.message,
    });
  }
});

export default updateRoomType;

// Delete a room type by ID
const deleteRoomType = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;

  const roomType = await RoomType.findByIdAndDelete(roomTypeId);

  if (!roomType) {
    return res
      .status(404)
      .json({ success: false, message: "Room type not found" });
  }

  res
    .status(200)
    .json({ success: true, message: "Room type deleted successfully" });
});
// roomtypeAvailability with date, number of rooms and price

const addRoomAvailability = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;
  const { date, price, available_rooms } = req.body;

  try {
    // Validate if the room type exists
    const roomTypeExists = await RoomType.findById(roomTypeId);
    if (!roomTypeExists) {
      return res.status(404).json({ success: false, message: "Room type not found" });
    }

    // Upsert: Create or update availability for the given date
    const availability = await RoomTypeAvailability.findOneAndUpdate(
      { room_type_id: roomTypeId, date },
      { price, available_rooms },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    console.error("Error adding room availability:", error);
    res.status(500).json({ success: false, message: "Failed to add room availability" });
  }
});



const getRoomAvailability = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;

  try {
      // Fetch the Room Type Document
      const roomType = await RoomType.findById(roomTypeId);
      if (!roomType) {
          return res.status(404).json({ success: false, message: "Room Type not found" });
      }

      // Get the Stay Document
      const stay = await Stay.findById(roomType.stay_id);
      if (!stay) {
          return res.status(404).json({ success: false, message: "Stay not found" });
      }

      // Fetch Room Availability Data
      const availability = await RoomTypeAvailability.find({ room_type_id: roomTypeId }).sort({ date: 1 });

      res.status(200).json({
          success: true,
          data: availability,
          stayTitle: stay.title, // Adding the stay title in the response
      });
  } catch (error) {
      console.error("Error fetching room availability:", error);
      res.status(500).json({ success: false, message: "Failed to fetch room availability" });
  }
});


const deleteRoomAvailability = asyncHandler(async (req, res) => {
  const { roomTypeId, date } = req.params;

  try {
    const deleted = await RoomTypeAvailability.findOneAndDelete({ room_type_id: roomTypeId, date });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Availability not found for the given date" });
    }

    res.status(200).json({ success: true, message: "Room availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting room availability:", error);
    res.status(500).json({ success: false, message: "Failed to delete room availability" });
  }
});

export {
  getAllRoomTypes,
  createRoomType,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
  addRoomAvailability,
  getRoomAvailability,
  deleteRoomAvailability,
};
