import { Router } from "express";
// import { createVendor, getVendors } from "../controllers/travelProviderController.js"; // Import vendor-related functions
import {
  getAllTravelProviders,
  getTravelProviderById,
  updateTravelProvider,
  disableTravelProvider,
  enableTravelProvider,
} from "../controllers/travelProviderController.js"; 
import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { admin } from "../middlewares/admin.middleware.js"; // Assuming you have an admin middleware

const router = Router();

// Vendor Routes
// router.route("/create").post(verifyJWT, admin, createVendor); // Create a new vendor (admin only)
// router.route("/all").get(verifyJWT, admin, getVendors); // Fetch all vendors (admin only)

// Travel Provider Routes
router.route("/").get(verifyJWT, getAllTravelProviders); // Fetch all travel providers (admin only)
router.route("/:travelProviderId").get(verifyJWT, getTravelProviderById); // Fetch a single travel provider by ID (admin only)
router.route("/:travelProviderId").put(verifyJWT, updateTravelProvider); // Update a travel provider (admin only)
router.route("/:travelProviderId/disable").put(verifyJWT, disableTravelProvider); // Disable a travel provider (admin only)
router.route("/:travelProviderId/enable").put(verifyJWT, enableTravelProvider); // Enable a travel provider (admin only)

export default router;