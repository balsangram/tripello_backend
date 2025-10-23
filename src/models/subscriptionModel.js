// models/subscriptionModel.js

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String], // Array of features (e.g., ["Free hosting", "2 hours of support"])
      required: true,
    },
    storageLimit: {
      type: String, // e.g., "5GB", "10GB", "1TB"
      required: true,
    },
    stayLimit: {
      type: Number, // Maximum number of stays a travel provider can create under this plan
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema); 