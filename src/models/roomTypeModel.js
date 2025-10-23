import { model, Schema } from "mongoose";

// RoomType Schema
const roomTypeSchema = new Schema({
  stay_id: {
    type: Schema.Types.ObjectId,
    ref: "Stay",
    required: true, // The stay this room belongs to
  },
  title: {
    type: String, // e.g., "Premium Suite", "Normal Suite"
    required: true,
  },
  description: {
    type: String, // Additional details about the room type
  },
  max_adults: {
    type: Number,
    required: true, // Maximum number of adults allowed in the room
  },
  max_children: {
    type: Number, // Maximum number of children allowed in the room
    default: 0,
  },
  price_per_night: {
    type: Number, // Price per night for this room type
    required: true,
  },
  beds: {
    type: Number, // Price per night for this room type
    required: true,
  },
  bedrooms: {
    type: Number, // Price per night for this room type
    required: true,
  },
  baths: {
    type: Number, // Price per night for this room type
    required: true,
  },

  availability: {
    type: Number, // Number of rooms of this type available
    required: true,
  },
  images: [
    {
      url: String, // URL to access the image
      key: String, // S3 key for the image
    },
  ],
});

export const RoomType = model("RoomType", roomTypeSchema);