// routes/userRoutes.js
import { Router } from "express";
import { getAllUsers, getUserById, updateUser, disableUser,enableUser ,updateMainUser} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all users (pagination and user type filtering)
router.route("/").get(verifyJWT, getAllUsers);

// Get a user by ID
router.route("/:userId").get(verifyJWT, getUserById);

// Update user details (admin only)
router.route("/admin/:userId").put(verifyJWT, updateUser);
router.route("/updateMainUser").put(verifyJWT, updateMainUser);




// Disable user (admin only)
router.route("/disable/:userId").put(verifyJWT, disableUser);
router.route("/enable/:userId").put(verifyJWT, enableUser);

export default router;
