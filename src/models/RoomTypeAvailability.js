import { model, Schema } from "mongoose";

// Room Availability Schema
const roomTypeAvailabilitySchema = new Schema(
  {
    room_type_id: {
      type: Schema.Types.ObjectId,
      ref: "RoomType", // Reference to the RoomType schema
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    available_rooms: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export const RoomTypeAvailability = model("RoomTypeAvailability", roomTypeAvailabilitySchema);
