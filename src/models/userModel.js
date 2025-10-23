import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    profileImage: [
      {
        url: {
          type: String,
          required: false, // The image URL is optional
        },
        key: {
          type: String,
          required: false, // The S3 key is optional as well
        },
      },
    ],
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dateofBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    aboutYou: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    
    location: {
      type: String,  
    },
    type: {
      type: String,
      enum: ["travelProvider", "admin", "user"],
      default: "user", // Default set to "user" instead of "admin"
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true, // New field for user activation status (default is true)
    },

    // New fields for subscription and trial
    trialStartDate: {
      type: Date,
      default: null, // Set when a travel provider is created
    },
    trialPeriodDays: {
      type: Number,
      default: 180, // 6 months (180 days)
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null, // Reference to the active subscription plan
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired", "pending"],
      default: "trial", // "trial" during the 6-month free period, "active" after subscription, "expired" if not renewed, "pending" if requested but not approved
    },
    subscriptionRequest: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null, // Reference to the requested subscription plan (pending approval)
    },
    staysCreated: {
      type: Number,
      default: 0, // Track the number of stays created by the travel provider
    },

  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Set trial start date for new travel providers
userSchema.pre("save", function (next) {
  if (this.isNew && this.type === "travelProvider" && !this.trialStartDate) {
    this.trialStartDate = new Date();
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
