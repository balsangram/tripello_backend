// controllers/subscriptionController.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptionModel.js";
import { User } from "../models/userModel.js";

// Fetch all subscription plans
const getAllSubscriptions = asyncHandler(async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json({
      subscriptions,
      message: "Subscriptions fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Error fetching subscriptions" });
  }
});

// Create a new subscription plan
const createSubscription = asyncHandler(async (req, res) => {
  const { name, price, description, features, storageLimit, stayLimit } = req.body;

  if (!name || !price || !description || !features || !storageLimit || !stayLimit) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingSubscription = await Subscription.findOne({ name });
    if (existingSubscription) {
      return res.status(409).json({ message: "Subscription plan with this name already exists" });
    }

    const subscription = await Subscription.create({
      name,
      price,
      description,
      features,
      storageLimit,
      stayLimit,
    });

    res.status(201).json({
      subscription,
      message: "Subscription plan created successfully",
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Error creating subscription" });
  }
});

// Update a subscription plan
const updateSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { name, price, description, features, storageLimit, stayLimit } = req.body;

  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Check if the new name already exists (excluding the current subscription)
    if (name && name !== subscription.name) {
      const existingSubscription = await Subscription.findOne({ name });
      if (existingSubscription) {
        return res.status(409).json({ message: "Subscription plan with this name already exists" });
      }
    }

    subscription.name = name || subscription.name;
    subscription.price = price || subscription.price;
    subscription.description = description || subscription.description;
    subscription.features = features || subscription.features;
    subscription.storageLimit = storageLimit || subscription.storageLimit;
    subscription.stayLimit = stayLimit || subscription.stayLimit;

    await subscription.save();

    res.status(200).json({
      subscription,
      message: "Subscription plan updated successfully",
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Error updating subscription" });
  }
});


// Request a subscription (Travel Provider)
const requestSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.body;
  const userId = req.user._id; // From verifyJWT middleware

  // Ensure the user is a travel provider
  if (req.user.type !== "travelProvider") {
    return res.status(403).json({ message: "Only travel providers can request subscriptions" });
  }

  // Check if the subscription exists
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription plan not found" });
  }

  // Check if the user already has a pending request or active subscription
  const user = await User.findById(userId);
  if (user.subscriptionStatus === "active") {
    return res.status(400).json({ message: "You already have an active subscription" });
  }
  if (user.subscriptionStatus === "pending") {
    return res.status(400).json({ message: "You already have a pending subscription request" });
  }

  // Check if the trial period has expired
  const trialEndDate = new Date(user.trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + user.trialPeriodDays);
  const currentDate = new Date();
  if (currentDate > trialEndDate && user.subscriptionStatus === "trial") {
    user.subscriptionStatus = "expired";
    await user.save();
    return res.status(400).json({ message: "Your trial period has expired. Please request a subscription." });
  }

  // Update the user's subscription request and status
  user.subscriptionRequest = subscriptionId;
  user.subscriptionStatus = "pending";
  await user.save();

  return res.status(200).json({ message: "Subscription request submitted successfully" });
});


// Get all subscription requests (Admin)
const getSubscriptionRequests = asyncHandler(async (req, res) => {
  // Ensure the user is an admin
  // if (req.user.type !== "admin" || req.user.type !== "travelProvider") {
  //   return res.status(403).json({ message: "Only admins can view subscription requests" });
  // }

  // Find all users with pending subscription requests
  const users = await User.find({ subscriptionStatus: "pending" })
    .populate("subscriptionRequest")
    .select("fullName email username subscriptionRequest subscriptionStatus trialStartDate trialPeriodDays");

  return res.status(200).json({ requests: users });
});

// Approve or reject a subscription request (Admin)
const handleSubscriptionRequest = asyncHandler(async (req, res) => {
  const { userId, action } = req.body; // action: "approve" or "reject"

  // Ensure the user is an admin
  // if (req.user.type !== "admin") {
  //   return res.status(403).json({ message: "Only admins can handle subscription requests" });
  // }

  // Validate action
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
  }

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Ensure the user has a pending request
  if (user.subscriptionStatus !== "pending" || !user.subscriptionRequest) {
    return res.status(400).json({ message: "No pending subscription request found for this user" });
  }

  if (action === "approve") {
    // Approve the request: assign the subscription and update status
    user.subscription = user.subscriptionRequest;
    user.subscriptionStatus = "active";
    user.subscriptionRequest = null; // Clear the request
  } else {
    // Reject the request: clear the request and revert status
    user.subscriptionRequest = null;
    user.subscriptionStatus = "trial"; // Revert to trial (or "expired" if trial period is over)
    const trialEndDate = new Date(user.trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + user.trialPeriodDays);
    if (new Date() > trialEndDate) {
      user.subscriptionStatus = "expired";
    }
  }

  await user.save();

  return res.status(200).json({
    message: `Subscription request ${action}d successfully`,
    user: {
      fullName: user.fullName,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      subscription: user.subscription,
    },
  });
});


export { getAllSubscriptions, createSubscription, updateSubscription,requestSubscription, getSubscriptionRequests, handleSubscriptionRequest };