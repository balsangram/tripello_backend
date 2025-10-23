import { Router } from "express";
import {
  createStay,
  deleteStay,
  getAllStays,
  getStayById,
  updateStay,
  getAllStaysWithoutToken,
  featureStay,
  unfeatureStay,
  getStatesAndCities,
  createReview,
  getAllReviewsByStay,
  getAllReviews,
  enableReview,
  disableReview
  // toggleFeaturedStatus
} from "../controllers/stayController.js";
import express from "express";

import {
  getAllRoomTypes,
  createRoomType,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
  addRoomAvailability,
  getRoomAvailability,
  deleteRoomAvailability,

} from "../controllers/roomTypeController.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import fileUploadWrapper from "../middlewares/fileUploadWrapper.js";

const router = Router();
// const router = express.Router();

// router.use(fileUploadWrapper(["POST", "PUT"]));

// Stays Routes



router.route("/all").get(verifyJWT, getAllStays);
// getAllStaysWithoutToken
router.route("/allStays").get(getAllStaysWithoutToken);
router.route("/getStatesAndCities").get(getStatesAndCities);

router.route("/create").post(verifyJWT, createStay);


//used in user side also
router.route("/:stayId").get(getStayById);
router.route("/update/:stayId").put(verifyJWT, updateStay);
router.route("/delete/:stayId").delete(verifyJWT, deleteStay);

// RoomTypes Routes
router.route("/:stayId/roomTypes").get(verifyJWT, getAllRoomTypes);
router.route("/:stayId/roomTypes/create").post(verifyJWT, createRoomType);
router.route("/roomTypes/:roomTypeId").get(verifyJWT, getRoomTypeById);
router.route("/:stayId/roomTypes/update/:roomTypeId").put(verifyJWT, updateRoomType);
router.route("/:stayId/roomTypes/delete/:roomTypeId").delete(verifyJWT, deleteRoomType);


router.post("/:roomTypeId/availability", addRoomAvailability);
//review
router.route("/createReview").post(verifyJWT, createReview);
router.route("/:stayId/reviews").get(verifyJWT, getAllReviewsByStay);
router.route("/latest-reviews").get(verifyJWT, getAllReviews);


// Get room availability
router.get("/:roomTypeId/availability", getRoomAvailability);

// Delete room availability for a specific date
router.delete("/:roomTypeId/availability/:date", deleteRoomAvailability);
// Routes for enabling and disabling feature

// router.post("/stay/feature/:stayId", toggleFeaturedStatus);  // To feature a stay
// router.post("/stay/unfeature/:stayId", toggleFeaturedStatus); 

//roomTypeAvailibility
router.route("/feature/:stayId").post(verifyJWT, featureStay);  // Route to feature a stay
router.route("/unfeature/:stayId").post(verifyJWT, unfeatureStay); // Route to unfeature a stay

// /stay/:stayId/reviews/:reviewId/enable
router.route("/:stayId/reviews/:reviewId/enable").post(verifyJWT, enableReview);
router.route("/:stayId/reviews/:reviewId/disable").post(verifyJWT, disableReview);


export default router;


// getAllRoomTypes