import { Router } from "express";
import {
  allPosts,
  createPost,
  deletePost,
  likePost,
  userPosts,
  createComment,
  createReply,
  getPostsByUser,
  togglePostStatus
} from "../controllers/postController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const postRouter = Router();

// Routes for posts
postRouter.route("/all").get(allPosts); // Get all posts
postRouter.route("/create").post(verifyJWT, createPost); // Create a post
postRouter.route("/delete/:postId").delete(verifyJWT, deletePost); // Delete a post
postRouter.route("/like/:postId").post(verifyJWT, likePost); // Like a post
postRouter.route("/userPost").get(verifyJWT, userPosts); // Get posts by the user

// Routes for comments
postRouter.route("/createComment").post(verifyJWT, createComment); // Create comment

// Routes for replies
postRouter.route("/comment/reply").post(verifyJWT, createReply); // Create reply
postRouter.route("/toggle/:postId").put(verifyJWT, togglePostStatus); // Toggle post status
postRouter.route("/getPostsByUser/:userId").get(verifyJWT, getPostsByUser);
export default postRouter;
