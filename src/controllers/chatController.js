import { Chat } from "../models/chatModel.js";
import { Booking } from "../models/bookingModel.js";
import { Stay } from "../models/stayModel.js";
import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import mongoose from "mongoose";

// ✅ Get chat messages for a specific booking


export const getChatMessages = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    console.log("🔍 Fetching chat for booking:", bookingId);

    // ✅ Find the Booking to get user & stay details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        console.log("🚨 Booking not found:", bookingId);
        return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // ✅ Find the Stay to get the host (travel provider)
    const stay = await Stay.findById(booking.stay_id);
    if (!stay || !stay.host_information?.vendor_id) {
        console.log("🚨 Stay or host not found:", booking.stay_id);
        return res.status(404).json({ success: false, message: "Stay or host not found" });
    }

    // ✅ Define chat participants
    const customerId = booking.user_id.toString(); // The customer who booked
    const hostId = stay.host_information.vendor_id.toString(); // The host (travel provider)
    const currentUserId = req.user._id.toString(); // Logged-in user

    console.log("💬 Chat Participants → Customer:", customerId, "Host:", hostId, "Current User:", currentUserId);

    // ✅ Allow both customer & host to initiate a chat
    let chat = await Chat.findOne({ booking_id: bookingId })
        .populate("messages.sender_id", "fullName email") // Populate sender details
        .populate("messages.receiver_id", "fullName email");

    if (!chat) {
        console.log("⚠️ No chat found. Creating new chat...");
        chat = await Chat.create({
            booking_id: bookingId,
            messages: [],
        });
    }

    // ✅ Determine the other chat participant
    let chatUser;
    const currentUserType = req.user.type;

    if (currentUserType === 'admin') {
        // If admin is viewing, the other user is the customer
        chatUser = await User.findById(customerId).select("fullName email profileImage");
    } else {
        // For customer and host
        if (currentUserId === customerId) {
            chatUser = await User.findById(hostId).select("fullName email profileImage");
        } else if (currentUserId === hostId) {
            chatUser = await User.findById(customerId).select("fullName email profileImage");
        }
    }

    if (!chatUser) {
        console.log("🚨 Chat user not found.");
        return res.status(404).json({ success: false, message: "Chat user not found" });
    }

    return res.status(200).json({
        success: true,
        messages: chat.messages, // Returns empty array if no messages exist
        user: chatUser,
        booking: {
            status: booking.status,
            totalPrice: booking.totalPrice,
        },
    });
});


// Send a message in chat (updated)
export const sendMessage = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { message } = req.body;
  
    // Validate required fields
    if (!message) {
      throw new ApiError(400, "Message is required");
    }
  
    // Validate bookingId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(400, "Invalid booking ID");
    }
  
    // Use the logged-in user's ID as the sender
    const sender_id = req.user._id;
  
    // Find the Booking to get user & stay details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }
  
    // Find the Stay to get the host (travel provider)
    const stay = await Stay.findById(booking.stay_id);
    if (!stay || !stay.host_information?.vendor_id) {
      throw new ApiError(404, "Stay or host not found");
    }
  
    // Define chat participants
    const customerId = booking.user_id.toString();
    const hostId = stay.host_information.vendor_id.toString();
    const senderId = sender_id.toString();
  
    // Ensure the sender is either the customer or the host
    if (senderId !== customerId && senderId !== hostId) {
      throw new ApiError(403, "You are not a participant in this chat");
    }
  
    // Determine the receiver_id
    const receiver_id = senderId === customerId ? hostId : customerId;
  
    // Validate that sender and receiver exist
    const sender = await User.findById(sender_id);
    const receiver = await User.findById(receiver_id);
    if (!sender) {
      throw new ApiError(404, "Sender not found");
    }
    if (!receiver) {
      throw new ApiError(404, "Receiver not found");
    }
  
    // Update or create the chat
    const chat = await Chat.findOneAndUpdate(
      { booking_id: bookingId },
      {
        $push: {
          messages: {
            sender_id,
            receiver_id,
            message,
            read: false,
            timestamp: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    ).populate("messages.sender_id messages.receiver_id");
  
    const newMessage = chat.messages[chat.messages.length - 1];
  
    return res.status(201).json({ success: true, newMessage });
  });
  

// ✅ Send a message in chat
export const sendMessage1 = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { sender_id, receiver_id, message } = req.body;

    if (!sender_id || !receiver_id || !message) {
        return res.status(400).json({ message: "Sender, receiver, and message are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const chat = await Chat.findOneAndUpdate(
        { booking_id: bookingId },
        {
            $push: {
                messages: {
                    sender_id,
                    receiver_id,
                    message,
                    read: false,
                    timestamp: new Date(),
                },
            },
        },
        { new: true, upsert: true }
    ).populate("messages.sender_id messages.receiver_id");

    const newMessage = chat.messages[chat.messages.length - 1];

    return res.status(201).json({ success: true, newMessage });
});


export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    // Use the logged-in user's ID to prevent spoofing
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const chat = await Chat.findOne({ booking_id: bookingId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    let updated = false;

    chat.messages.forEach((msg) => { // ✅ Only update unread messages for the logged-in user
        if (msg.receiver_id.toString() === userId && !msg.read) { // ✅ Only update unread messages
            msg.read = true;
            updated = true;
        }
    });

    if (updated) {
        await chat.save();
    }

    res.status(200).json({ success: true, message: "Messages marked as read" });
});


// ✅ Mark messages as read
export const markMessagesAsRead2 = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const chat = await Chat.findOne({ booking_id: bookingId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    chat.messages.forEach((msg) => {
        if (msg.receiver_id.toString() === userId) {
            msg.read = true;
        }
    });

    await chat.save();
    res.status(200).json({ success: true, message: "Messages marked as read" });
});


export const markMessagesAsRead1 = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const chat = await Chat.findOne({ booking_id: bookingId });
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    chat.messages.forEach((msg) => {
        if (msg.receiver_id.toString() === userId) {
            msg.read = true;
        }
    });

    await chat.save();
    res.status(200).json({ success: true, message: "Messages marked as read" });
});
