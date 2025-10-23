import { Booking } from "../models/bookingModel.js";
import { RoomType } from "../models/roomTypeModel.js";
import { Stay } from "../models/stayModel.js";
import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// ✅ Create a new booking
const createBooking = asyncHandler(async (req, res) => {
  const {
    user_id,
    roomTypeId,
    numRooms,
    numAdults,
    numChildren,
    startDate,
    endDate,
    totalPrice,
    userMessage,
  } = req.body;

  console.log(req.body, "requests coming in the booking function");
  
  try {
    // Validate user
    const user = await User.findById(user_id);
    console.log("🚀 ~ user:", user)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate room type
    const roomType = await RoomType.findById(roomTypeId);
    console.log("🚀 ~ roomType:", roomType)
    if (!roomType) {
      return res
        .status(404)
        .json({ success: false, message: "Room type not found" });
    }

    // Fetch stay_id from roomType
    const stay = await Stay.findById(roomType.stay_id);
    console.log("🚀 ~ stay:", stay)
    if (!stay) {
      return res
        .status(404)
        .json({ success: false, message: "Stay not found" });
    }

    // Create booking
    const booking = await Booking.create({
      user_id,
      stay_id: stay._id,
      roomTypeId,
      numRooms,
      numAdults,
      numChildren,
      startDate,
      endDate,
      totalPrice,
      userMessage,
      status: "pending",
    });
    console.log("🚀 ~ booking:", booking)
    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking_id: booking._id, // Explicitly include the booking_id
      data: booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while creating booking" });
  }
});

// ✅ Get all bookings
const getAllBookings = asyncHandler(async (req, res) => {
  try {
    const bookings = await Booking.find().populate(
      "user_id roomTypeId stay_id"
    );
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
});

const getBookingsForStay = asyncHandler(async (req, res) => {
  const { stayId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(stayId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stay ID format",
      });
    }

    const bookings = await Booking.find({ stay_id: stayId })
  .populate("user_id", "fullName email")
  .populate("roomTypeId", "title beds bedrooms baths price_per_night images")
  .populate("stay_id", "title images location")
  .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this stay",
      });
    }

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
});

  // ✅ Update your Express Router
//   router.get("/stay/:stayId/bookings", verifyJWT, getBookingsForStay);

  

// controllers/bookingController.js (updated)

const getUserBookings = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Fetch bookings for the user
    const bookings = await Booking.find({ user_id: userId })
      .populate({
        path: "stay_id",
        select: "_id title images location",
      })
      .populate({
        path: "roomTypeId",
        select: "_id type",
      })
      .sort({ createdAt: -1 }); 

    // If no bookings are found, return 200 with a message
    if (!bookings.length) {
      return res.status(200).json({
        success: true,
        message: "No bookings present for this user",
        data: [],
      });
    }

    // Format the bookings
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      stay: {
        _id: booking.stay_id?._id || "N/A",
        title: booking.stay_id?.title || "Stay Name Not Available",
        images: booking.stay_id?.images || [{ url: "/placeholder.jpg" }],
        location: booking.stay_id?.location || "Location Unavailable",
      },
      roomType: {
        _id: booking.roomTypeId?._id || "N/A",
        name: booking.roomTypeId?.type || "Room Type Not Available",
      },
      numRooms: booking.numRooms || 1,
      numAdults: booking.numAdults || 1,
      numChildren: booking.numChildren || 0,
      status: booking.status,
      checkIn: booking.startDate,
      checkOut: booking.endDate,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: formattedBookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user bookings",
    });
  }
});

// export { getUserBookings };

// ✅ Get bookings by `user_id`
const getUserBookings1 = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }
  
      const bookings = await Booking.find({ user_id: userId })
        .populate({
          path: "stay_id",
          select: "_id title images location", // ✅ Include _id for stays
        })
        .populate({
          path: "roomTypeId",
          select: "_id type", // ✅ Include _id for room types
        });
  
      if (!bookings.length) {
        return res.status(404).json({
          success: false,
          message: "No bookings found for this user",
        });
      }
  
      const formattedBookings = bookings.map((booking) => ({
        _id: booking._id,
        stay: {
          _id: booking.stay_id?._id || "N/A",
          title: booking.stay_id?.title || "Stay Name Not Available",
          images: booking.stay_id?.images || [{ url: "/placeholder.jpg" }],
          location: booking.stay_id?.location || "Location Unavailable",
        },
        roomType: {
          _id: booking.roomTypeId?._id || "N/A",
          name: booking.roomTypeId?.type || "Room Type Not Available",
      
        },
        numRooms: booking.numRooms || 1, // ✅ Ensure numRooms exists
        numAdults: booking.numAdults || 1, // ✅ Ensure numAdults exists
        numChildren: booking.numChildren || 0, // ✅ Ensure numChildren exists
        status: booking.status,
        checkIn: booking.startDate,
        checkOut: booking.endDate,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
      }));
  
      return res.status(200).json({ success: true, data: formattedBookings });
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user bookings",
      });
    }
  });
  
  

// ✅ Update booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, totalPrice } = req.body;
  console.log("status",status);
  console.log("totalPrice",totalPrice);
  

  try {
    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    const updateData = { status };
    if (totalPrice !== undefined) {
      updateData.totalPrice = totalPrice; // Update total price if provided
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ success: false, message: "Failed to update booking status" });
  }
});



const getBookingDetails = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    console.log("🚀 ~ req.params:", req.params)
  
    try {
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID format",
        });
      }
  
      const booking = await Booking.findById(bookingId)
      .populate("user_id", "fullName email phoneNumber") // Fetch user details
      .populate("roomTypeId", "type ") // Fetch room type details
      .populate("stay_id", "title images location stay_information state city pincode"); // Add missing fields
      console.log("🚀 ~ booking:", booking)
    
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
  
      const formattedBooking = {
        _id: booking._id,
        user: {
          fullName: booking.user_id?.fullName || "N/A",
          email: booking.user_id?.email || "N/A",
          phoneNumber: booking.user_id?.phoneNumber || "N/A",
        },
        stay: {
          _id: booking.stay_id?._id || "N/A",
          title: booking.stay_id?.title || "Stay Name Not Available",
          images: booking.stay_id?.images || [{ url: "/placeholder.jpg" }],
          location: booking.stay_id?.locationUrl || "Location Unavailable",
          stay_information: booking.stay_id?.stay_information || "No description available",
          state: booking.stay_id?.state || "State Not Available",
          pincode: booking.stay_id?.pincode || "Pincode Not Available",
          city: booking.stay_id?.city || "City Not Available",



        },
        roomType: {
          _id: booking.roomTypeId?._id || "N/A",
          name: booking.roomTypeId?.type || "Room Type Not Available",
          // bedType: booking.roomTypeId?.bedType || "Unknown",
          // amenities: booking.roomTypeId?.amenities || [],
        },
        numRooms: booking.numRooms,
        numAdults: booking.numAdults,
        numChildren: booking.numChildren,
        checkIn: booking.startDate,
        checkOut: booking.endDate,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
        status: booking.status,
      };
  
      return res.status(200).json({ success: true, data: formattedBooking });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch booking details",
      });
    }
  });
  
  // ✅ Add this to your Express Router
//   router.get("/booking/:bookingId/details", verifyJWT, getBookingDetails);

  


export { createBooking, getAllBookings, getUserBookings, updateBookingStatus,getBookingsForStay ,getBookingDetails};
