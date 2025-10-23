import { Router } from "express";
import {
  getAllStates,
  getStateById,
  createState,
  updateState,
  disableState,
  getActiveStates,
  enableState,

} from "../controllers/stateController.js";
import {

  getAllCities,
  getCityById,
  createCity,
  updateCity,
  disableCity,
  enableCity,
  getActiveCities,
  getCitiesByStateId
} from "../controllers/cityController.js";
import {
  getAllQueries,
  updateQueryStatus,
  createQuery,
} from "../controllers/queryController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT Middleware

const router = Router();

// ✅ Fetch all queries (Protected)
router.route("/queries").get(verifyJWT, getAllQueries);

// ✅ Update the status of a query (Mark as read) (Protected)
router.route("/queries/:queryId/status").put(verifyJWT, updateQueryStatus);

// ✅ Submit a new query (Contact form) (No JWT required)
router.route("/contact-us").post(createQuery);

// ✅ Fetch all states (Protected)
router.route("/states").get(verifyJWT, getAllStates);
router.route("/states").get(getAllStates);

// ✅ Fetch state by ID (Protected)
router.route("/states/:stateId").get(verifyJWT, getStateById);

// ✅ Create a new state (Protected)
router.route("/states").post(verifyJWT, createState);

// ✅ Edit/update an existing state (Protected)
router.route("/states/:stateId").put(verifyJWT, updateState);

// ✅ Disable a state (Protected)
router.route("/states/:stateId/disable").put(verifyJWT, disableState);
router.route("/states/:stateId/enable").put(verifyJWT,enableState);

// ✅ Fetch only active states (🟢 No JWT Required)
router.route("/public/states").get(getActiveStates); 

/* ====== 📍 CITY ROUTES ====== */

// ✅ Fetch all cities (Protected)
router.route("/cities").get(verifyJWT, getAllCities);
// getCitiesByStateId
router.route("/cities/state/:state_id").get(verifyJWT, getCitiesByStateId);

// ✅ Fetch city by ID (Protected)
router.route("/cities/:cityId").get(verifyJWT, getCityById);

// ✅ Create a new city (Protected)
router.route("/cities").post(verifyJWT, createCity);

// ✅ Edit/update an existing city (Protected)
router.route("/cities/:cityId").put(verifyJWT, updateCity);

// ✅ Disable a city (Protected)
router.route("/cities/:cityId/disable").put(verifyJWT, disableCity);
router.route("/cities/:cityId/enable").put(verifyJWT, enableCity);


// ✅ Fetch only active cities (🟢 No JWT Required)
router.route("/public/cities").get(getActiveCities); 

export default router;
// ab