import { Schema, model } from "mongoose";

// Chat Schema
const ChatSchema = new Schema(
  {
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true, 
    },
    messages: [
      {
        sender_id: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        receiver_id: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Chat = model("Chat", ChatSchema);
