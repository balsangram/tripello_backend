import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // content: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    images: [
      {
        url: { type: String, required: true, trim: true }, // ✅ Image URL
        key: { type: String, trim: true }, // ✅ Optional S3 key (if using AWS S3)
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stay_id: {
      type: Schema.Types.ObjectId,
      ref: "Stay", // ✅ Optional field, users may or may not tag a stay
      default: null,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "blocked"], // ✅ Admin controls post visibility
      default: "approved",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("Post", postSchema);
