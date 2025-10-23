import mongoose, { Schema } from "mongoose";

const replySchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Reply = mongoose.model("Reply", replySchema);
