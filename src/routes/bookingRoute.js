import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getUserBookings,
  updateBookingStatus,
  getBookingDetails,
  getBookingsForStay,
} from "../controllers/bookingController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT Middleware

const router = Router();

// Apply JWT Authentication Middleware
router.use(verifyJWT);

router.route("/:stayId/bookings").get(getBookingsForStay);
// Booking Routes with `router.route()`
router
  .route("/")
  .post(createBooking) // Create a new booking (Protected)
  .get(getAllBookings); // Get all bookings (Protected)

router.route("/user/:userId").get(getUserBookings); // Get all bookings for a specific user (Protected)

router.route("/:bookingId/status").put(updateBookingStatus); // Update the status of a booking (Protected)

// get one booking detail for travel provider
router.route("/:bookingId/details").get(getBookingDetails);

export default router;
