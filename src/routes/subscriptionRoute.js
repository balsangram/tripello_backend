// routes/subscriptionRoutes.js

import { Router } from "express";
import { getAllSubscriptions, createSubscription, updateSubscription ,



  requestSubscription,
  getSubscriptionRequests,
  handleSubscriptionRequest,


} from "../controllers/subscriptionController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { admin } from "../middlewares/admin.middleware.js";

const router = Router();

// Admin-only routes
router.route("/").get(verifyJWT, getAllSubscriptions); // Fetch all subscription plans
router.route("/create").post(verifyJWT, createSubscription); // Create a new subscription plan
router.route("/:subscriptionId").put(verifyJWT, updateSubscription); // Update a subscription plan


// Travel Provider routes
router.route("/request").post(verifyJWT, requestSubscription);

// Admin routes for handling subscription requests
router.route("/requests").get(verifyJWT, getSubscriptionRequests);
router.route("/requests/handle").post(verifyJWT, handleSubscriptionRequest);

export default router;