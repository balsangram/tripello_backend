// models/reviewModel.js

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  stay_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stay",
    required: true,
  },
  stay_title: {
    type: String, // Store the stay title at the time of review creation
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user_name: {
    type: String, // Store the user's name at the time of review creation
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000, // Limit comment length
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5, // Rating between 1 and 5
  },
  isEnabled: {
    type: Boolean,
    default: true, // Add isEnabled field to match frontend expectations
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Review = mongoose.model("Review", reviewSchema);