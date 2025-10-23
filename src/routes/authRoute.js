import { Router } from "express";
import {
  loginUser,
  logoutUser,
  // refreshAccessToken,
  registerUser,
  getUserDetails,
  refreshToken,
  updateUserDetails,
  getUserById,
} from "../controllers/authController.js";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";


router.route("/register").post(registerUser);

router.route("/login").post(loginUser);
//secured routes
router.route("/me").get(verifyJWT, getUserDetails);
router.route("/updateUserDetails").put(verifyJWT, updateUserDetails);
router.route("/logout").post(logoutUser);
router.route("/:userId").get(verifyJWT, getUserById);

//routes for posts


// router.route("/refresh-token").post(refreshAccessToken);
// router.route("/me").get(verifyJWT,getUserDetails);
router.route("/refresh").post(refreshToken);

// router.route("categories").post(createCategory);

router
  .route("/categories")
  .get(verifyJWT, getCategories) // Get all categories
  .post(verifyJWT, createCategory);

router
  .route("/categories/:id")
  .get(getCategoryById) // Get a category by ID
  .patch(updateCategory) // Update a category
  .delete(deleteCategory); // Delete a category

export default router;
