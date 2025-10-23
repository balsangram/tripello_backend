import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "State name is required"],
      unique: true,
      trim: true,
    },
    image: {
      url: { type: String, required: true }, // Image URL (S3 or Cloud Storage)
      key: { type: String, required: true }, // File key for storage reference
    },
    isActive: {
      type: Boolean,
      default: true, // Default: state is active
    },
  },
  { timestamps: true }
);

export const State = mongoose.model("State", stateSchema);
