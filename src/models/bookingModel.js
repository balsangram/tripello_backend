import { Schema, model } from "mongoose";

// Booking Schema
const BookingSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: true,
    },
    stay_id: {
      type: Schema.Types.ObjectId,
      ref: "Stay", // References the Stay model
      required: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: "RoomType", // References the RoomType model
      required: true,
    },
    numRooms: {
      type: Number,
      required: true,
    },
    numAdults: {
      type: Number,
      required: true,
    },
    numChildren: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    userMessage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Booking = model("Booking", BookingSchema);
