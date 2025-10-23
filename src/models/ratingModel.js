// models/ratingModel.js

import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  stay_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stay",
    required: true,
    unique: true, // One rating entry per stay
  },
  stay_title: {
    type: String, // Store the stay title at the time of rating creation
    required: true,
  },
  average_rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0,
  },
  total_reviews: {
    type: Number,
    required: true,
    default: 0,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

export const Rating = mongoose.model("Rating", ratingSchema);