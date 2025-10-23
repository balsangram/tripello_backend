import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "City name is required"],
      unique: true,
      trim: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State reference is required"],
    },
    image: {
      url: { type: String, required: true }, // Image URL (S3 or Cloud Storage)
      key: { type: String, required: true }, // File key for storage reference
    },
    isActive: {
      type: Boolean,
      default: true, // Default: city is active
    },
  },
  { timestamps: true }
);

export const City = mongoose.model("City", citySchema);
