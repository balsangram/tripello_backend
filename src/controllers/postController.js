// import { Post } from "../models/postModel.js";
// import { User } from "../models/userModel.js";
// import { putObject } from "../../util/putObject.js";
// import { v4 as uuidv4 } from "uuid";
// import mongoose from "mongoose";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { Comment } from "../models/commentModel.js"; // Import the Comment model
// import { Reply } from "../models/replyModel.js"; // Import the Comment model

// const createPost = asyncHandler(async (req, res) => {
//   const { description, stay_id } = req.body;
//   const files = req.files?.images; // ✅ Retrieve uploaded images

//   // ✅ Validation: Description is Required
//   if (!description) {
//     return res.status(400).json({ message: "Description is required" });
//   }

//   try {
//     const userId = req.user?._id;

//     // ✅ Step 1: Validate User Exists
//     const user = await User.findById(userId).select("-password -refreshToken");
//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // ✅ Step 2: Handle Image Uploads (if provided)
//     const uploadedImages = [];
//     if (files) {
//       const imagesArray = Array.isArray(files) ? files : [files]; // ✅ Handle single/multiple images

//       for (const image of imagesArray) {
//         const fileName = `images/posts/${uuidv4()}_${image.name}`;

//         // ✅ Upload image to S3 or storage bucket
//         const uploadedImage = await putObject(image, fileName);

//         if (uploadedImage) {
//           uploadedImages.push({
//             url: uploadedImage.url, // ✅ Store actual uploaded URL
//             key: uploadedImage.key, // ✅ Store file reference
//           });
//         }
//       }
//     }

//     // ✅ Step 3: Create Post with Stay Tag (if provided)
//     const post = await Post.create({
//       description, // ✅ Only one description field
//       images: uploadedImages, // ✅ Stores image objects with URL & Key
//       user: userId,
//       stay_id: stay_id || null, // ✅ Allows optional stay tagging
//       status: "pending", // ✅ Default status (admin can review later)
//     });

//     return res.status(201).json({
//       post,
//       message: "Post created successfully",
//     });
//   } catch (e) {
//     console.error("❌ Error creating post:", e);
//     return res.status(500).json({
//       message: "Server error while creating post",
//       error: e.message,
//     });
//   }
// });



// const deletePost = async (req, res) => {
//   const { postId } = req.params;

//   if (!postId) {
//     throw new ApiError(400, "Post ID is required");
//   }

//   try {
//     const userId = req.user?._id;

//     // Fetch the user from the database
//     const user = await User.findById(userId).select("-password -refreshToken");

//     if (!user) {
//       return res.status(401).json({
//         message: "User not found",
//       });
//     }

//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({
//         message: "Post not found",
//       });
//     }

//     await post.deleteOne({ _id: postId });

//     return res.status(200).json("Post deleted successfully");
//   } catch (e) {
//     console.log(e);
//     return res.status(500).json("Server error while deleting post");
//   }
// };

// // Fetch posts by the logged-in user
// const userPosts = async (req, res) => {
//   try {
//     // Get the user ID from the request (it can be from params, body, or JWT)
//     const userId = req.user._id;  // Assuming the user ID is stored in the request via authentication middleware

//     // Find posts only for the specific user
//     const posts = await Post.find({ user: userId }).populate([
//       {
//         path: "user",
//         select: "-password -refreshTokens -refreshToken", // Populate user info, excluding sensitive fields
//       },
//       {
//         path: "comments",
//         populate: [
//           {
//             // Populate replies within comments
//             path: "replies",
//             populate: {
//               path: "user",
//               select: "-password -refreshTokens -refreshToken", // Populate user info
//             },
//           },
//           {
//             // Populate user info within comments
//             path: "user",
//             select: "-password -refreshTokens -refreshToken", // Exclude password and refreshToken
//           },
//         ],
//       },
//     ]);

//     // Modify posts to include image details
//     const postsWithImageDetails = posts.map(post => ({
//       ...post.toObject(),
//       images: post.images.map(image => ({
//         url: image.url,   // Include image URL
//         key: image.key    // Include image S3 key
//       })),
//     }));

//     console.log("User posts with image details", postsWithImageDetails);

//     return res.status(200).json({
//       posts: postsWithImageDetails,
//       message: "User's posts fetched successfully",
//     });
//   } catch (e) {
//     console.error("Error while fetching user posts:", e);
//     return res.status(500).json({
//       message: "Error while fetching user posts",
//     });
//   }
// };

// // Fetch all posts (approved posts)
// const allPosts = async (req, res) => {
//   try {

//     // approved posts being sent
//     const posts = await Post.find({ status: "approved" }) // Filter for approved posts only      .sort({ createdAt: -1 }) // Sort by createdAt in descending order to get the latest first
//       .populate([
//         {
//           path: "user",
//           select: "-password -refreshTokens -refreshToken", // Populate user info, excluding sensitive fields
//         },
//         {
//           path: "comments",
//           populate: [
//             {
//               // Populate replies within comments
//               path: "replies",
//               populate: {
//                 path: "user",
//                 select: "-password -refreshTokens -refreshToken", // Populate user info
//               },
//             },
//             {
//               // Populate user info within comments
//               path: "user",
//               select: "-password -refreshTokens -refreshToken", // Exclude password and refreshToken
//             },
//           ],
//         },
//       ]);

//     // You can modify posts here to include image details
//     const postsWithImageDetails = posts.map(post => ({
//       ...post.toObject(),
//       images: post.images.map(image => ({
//         url: image.url,   // Include image URL
//         key: image.key    // Include image S3 key
//       })),
//     }));

//     console.log("All posts with image details", postsWithImageDetails);

//     return res.status(200).json({
//       posts: postsWithImageDetails,
//       message: "Posts fetched successfully",
//     });
//   } catch (e) {
//     console.error("Error while fetching all posts:", e);
//     return res.status(500).json({
//       message: "Error while fetching all posts",
//     });
//   }
// };



// //post like
// const likePost = async (req, res) => {
//   const { postId } = req.params;

//   if (!postId) {
//     return res.status(400).json({ message: "Post ID is required" });
//   }

//   try {
//     const userId = req.user?._id;

//     const user = await User.findById(userId).select("-password -refreshToken");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }
//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     if (post.likes.includes(user._id)) {
//       post.likes.splice(post.likes.indexOf(user._id), 1);
//       await post.save();
//       return res.status(200).json({
//         post,
//         message: "Post unliked successfully",
//       });
//     } else {
//       post.likes.push(user._id);
//       await post.save();
//       return res.status(200).json({
//         post,
//         message: "Post liked successfully",
//       });
//     }
//   } catch (error) {
//     console.error("Error in likePost:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// //create comment
// const createComment = async (req, res) => {
//   const { content, postId } = req.body;

//   // Validation
//   if (!content) {
//     return res.status(400).json({
//       message: "Content is required",
//     });
//   }

//   try {
//     const userId = req.user?._id;

//     // Find user
//     const user = await User.findById(userId).select("-password -refreshToken");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const post = await Post.findById(postId);

//     const comment = await Comment.create({
//       content,
//       user: userId,
//       post: postId,
//     });

//     post.comments.push(comment._id);
//     await user.save();
//     await post.save();

//     return res.status(201).json({
//       comment,
//       message: "comment added successfully",
//     });
//   } catch (e) {
//     console.error("Error adding comment:", e);
//     return res.status(500).json({
//       message: "Server error while adding comment",
//     });
//   }
// };

// //create comment reply
// const createReply = async (req, res) => {
//   const { content, commentId } = req.body;

//   if (!content) {
//     return res.status(400).json({
//       message: "Content is required",
//     });
//   }

//   try {
//     const userId = req.user?._id;

//     // Find user
//     const user = await User.findById(userId).select("-password -refreshToken");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // Log the commentId to check its value
//     console.log("Comment ID:", commentId);
//     const comment = await Comment.findById(commentId);

//     const reply = await Reply.create({
//       content,
//       user: userId,
//       comment: commentId,
//     });

//     console.log(comment);

//     comment.replies.push(reply._id);
//     await comment.save();

//     return res.status(200).json({
//       reply,
//       message: "reply added successfully",
//     });
//   } catch (e) {
//     console.error("Error adding reply:", e);
//     return res.status(500).json({
//       message: "Server error while adding reply",
//     });
//   }
// };


// // Toggle post status (Admin)
// const togglePostStatus = asyncHandler(async (req, res) => {
//   const { postId } = req.params;
//   const { action } = req.body; // "approve" or "block"

//   if (!["approve", "block"].includes(action)) {
//     throw new ApiError(400, "Invalid action. Use 'approve' or 'block'.");
//   }

//   const post = await Post.findById(postId);
//   if (!post) {
//     throw new ApiError(404, "Post not found");
//   }

//   post.status = action === "approve" ? "approved" : "blocked";
//   await post.save();

//   return res.status(200).json({
//     success: true,
//     message: `Post has been ${action}d`,
//     post,
//   });
// });

// //for admin, as the vaidations for approve or pending is not being checked
// const getPostsByUser = asyncHandler(async (req, res) => {
//   const { userId } = req.params;

//   // Validate userId
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     throw new ApiError(400, "Invalid user ID");
//   }

//   // Ensure the user exists
//   const user = await User.findById(userId).select("fullName email username profileImage");
//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   // Fetch all posts by the user
//   const posts = await Post.find({ user: userId })
//     .populate("stay_id", "title location") // Populate stay details (if any)
//     .populate("likes", "fullName email") // Populate users who liked the post
//     .populate({
//       path: "comments",
//       populate: {
//         path: "user_id",
//         select: "fullName email",
//       },
//     }) // Populate comments and the user who made each comment
//     .sort({ createdAt: -1 }); // Sort by creation date (newest first)

//   return res.status(200).json({
//     success: true,
//     message: "Posts fetched successfully",
//     user,
//     posts,
//   });
// });

// export {
//   createPost,
//   deletePost,
//   userPosts,
//   allPosts,
//   likePost,
//   createComment,
//   createReply,
//   togglePostStatus,
//   getPostsByUser
// };


import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { putObject } from "../../util/putObject.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/commentModel.js"; // Import the Comment model
import { Reply } from "../models/replyModel.js"; // Import the Comment model

const createPost = asyncHandler(async (req, res) => {
  const { description, stay_id } = req.body;
  const files = req.files?.images; // ✅ Retrieve uploaded images

  // ✅ Validation: Description is Required
  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const userId = req.user?._id;

    // ✅ Step 1: Validate User Exists
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Step 2: Handle Image Uploads (if provided)
    const uploadedImages = [];
    if (files) {
      const imagesArray = Array.isArray(files) ? files : [files]; // ✅ Handle single/multiple images

      for (const image of imagesArray) {
        const fileName = `images/posts/${uuidv4()}_${image.name}`;

        // ✅ Upload image to S3 or storage bucket
        const uploadedImage = await putObject(image, fileName);

        if (uploadedImage) {
          uploadedImages.push({
            url: uploadedImage.url, // ✅ Store actual uploaded URL
            key: uploadedImage.key, // ✅ Store file reference
          });
        }
      }
    }

    // ✅ Step 3: Create Post with Stay Tag (if provided)
    const post = await Post.create({
      description, // ✅ Only one description field
      images: uploadedImages, // ✅ Stores image objects with URL & Key
      user: userId,
      stay_id: stay_id || null, // ✅ Allows optional stay tagging
      status: "pending", // ✅ Default status (admin can review later)
    });

    return res.status(201).json({
      post,
      message: "Post created successfully",
    });
  } catch (e) {
    console.error("❌ Error creating post:", e);
    return res.status(500).json({
      message: "Server error while creating post",
      error: e.message,
    });
  }
});



const deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  try {
    const userId = req.user?._id;

    // Fetch the user from the database
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    await post.deleteOne({ _id: postId });

    return res.status(200).json("Post deleted successfully");
  } catch (e) {
    console.log(e);
    return res.status(500).json("Server error while deleting post");
  }
};

// Fetch posts by the logged-in user
const userPosts = async (req, res) => {
  try {
    // Get the user ID from the request (it can be from params, body, or JWT)
    const userId = req.user._id;  // Assuming the user ID is stored in the request via authentication middleware

    // Find posts only for the specific user
    const posts = await Post.find({ user: userId }).populate([
      {
        path: "user",
        select: "-password -refreshTokens -refreshToken", // Populate user info, excluding sensitive fields
      },
      {
        path: "comments",
        populate: [
          {
            // Populate replies within comments
            path: "replies",
            populate: {
              path: "user",
              select: "-password -refreshTokens -refreshToken", // Populate user info
            },
          },
          {
            // Populate user info within comments
            path: "user",
            select: "-password -refreshTokens -refreshToken", // Exclude password and refreshToken
          },
        ],
      },
    ]);

    // Modify posts to include image details
    const postsWithImageDetails = posts.map(post => ({
      ...post.toObject(),
      images: post.images.map(image => ({
        url: image.url,   // Include image URL
        key: image.key    // Include image S3 key
      })),
    }));

    console.log("User posts with image details", postsWithImageDetails);

    return res.status(200).json({
      posts: postsWithImageDetails,
      message: "User's posts fetched successfully",
    });
  } catch (e) {
    console.error("Error while fetching user posts:", e);
    return res.status(500).json({
      message: "Error while fetching user posts",
    });
  }
};

// Fetch all posts (approved posts)
const allPosts = async (req, res) => {
  try {

    // approved posts being sent
    const posts = await Post.find({ status: "approved" }) // Filter for approved posts only      .sort({ createdAt: -1 }) // Sort by createdAt in descending order to get the latest first
      .populate([
        {
          path: "user",
          select: "-password -refreshTokens -refreshToken", // Populate user info, excluding sensitive fields
        },
        {
          path: "comments",
          populate: [
            {
              // Populate replies within comments
              path: "replies",
              populate: {
                path: "user",
                select: "-password -refreshTokens -refreshToken", // Populate user info
              },
            },
            {
              // Populate user info within comments
              path: "user",
              select: "-password -refreshTokens -refreshToken", // Exclude password and refreshToken
            },
          ],
        },
      ]);

    // You can modify posts here to include image details
    const postsWithImageDetails = posts.map(post => ({
      ...post.toObject(),
      images: post.images.map(image => ({
        url: image.url,   // Include image URL
        key: image.key    // Include image S3 key
      })),
    }));

    console.log("All posts with image details", postsWithImageDetails);

    return res.status(200).json({
      posts: postsWithImageDetails,
      message: "Posts fetched successfully",
    });
  } catch (e) {
    console.error("Error while fetching all posts:", e);
    return res.status(500).json({
      message: "Error while fetching all posts",
    });
  }
};



//post like
const likePost = async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(user._id)) {
      post.likes.splice(post.likes.indexOf(user._id), 1);
      await post.save();
      return res.status(200).json({
        post,
        message: "Post unliked successfully",
      });
    } else {
      post.likes.push(user._id);
      await post.save();
      return res.status(200).json({
        post,
        message: "Post liked successfully",
      });
    }
  } catch (error) {
    console.error("Error in likePost:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//create comment
const createComment = async (req, res) => {
  const { content, postId } = req.body;

  // Validation
  if (!content) {
    return res.status(400).json({
      message: "Content is required",
    });
  }

  try {
    const userId = req.user?._id;

    // Find user
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const post = await Post.findById(postId);

    const comment = await Comment.create({
      content,
      user: userId,
      post: postId,
    });

    post.comments.push(comment._id);
    await user.save();
    await post.save();

    return res.status(201).json({
      comment,
      message: "comment added successfully",
    });
  } catch (e) {
    console.error("Error adding comment:", e);
    return res.status(500).json({
      message: "Server error while adding comment",
    });
  }
};

//create comment reply
const createReply = async (req, res) => {
  const { content, commentId } = req.body;

  if (!content) {
    return res.status(400).json({
      message: "Content is required",
    });
  }

  try {
    const userId = req.user?._id;

    // Find user
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Log the commentId to check its value
    console.log("Comment ID:", commentId);
    const comment = await Comment.findById(commentId);

    const reply = await Reply.create({
      content,
      user: userId,
      comment: commentId,
    });

    console.log(comment);

    comment.replies.push(reply._id);
    await comment.save();

    return res.status(200).json({
      reply,
      message: "reply added successfully",
    });
  } catch (e) {
    console.error("Error adding reply:", e);
    return res.status(500).json({
      message: "Server error while adding reply",
    });
  }
};


// Toggle post status (Admin)
const togglePostStatus = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { action } = req.body; // "approve" or "block"

  if (!["approve", "block"].includes(action)) {
    throw new ApiError(400, "Invalid action. Use 'approve' or 'block'.");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  post.status = action === "approve" ? "approved" : "blocked";
  await post.save();

  return res.status(200).json({
    success: true,
    message: `Post has been ${action}d`,
    post,
  });
});

//for admin, as the vaidations for approve or pending is not being checked
const getPostsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Ensure the user exists
  const user = await User.findById(userId).select("fullName email username profileImage");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Fetch all posts by the user
  const posts = await Post.find({ user: userId })
    .populate("user", "fullName email username profileImage") // ✅ Populate post's user details
    .populate("stay_id", "title location") // Populate stay details (if any)
    .populate("likes", "fullName email username") // Populate users who liked the post
    .populate({
      path: "comments",
      populate: [
        {
          // Populate replies within comments
          path: "replies",
          populate: {
            path: "user",
            select: "fullName email username", // Populate user info
          },
        },
        {
          // Populate user info within comments
          path: "user",
          select: "fullName email username", // ✅ Fixed: Use "user" instead of "user_id"
        },
      ],
    }) // Populate comments and the user who made each comment
    .sort({ createdAt: -1 }); // Sort by creation date (newest first)

  // ✅ If posts are empty, it might indicate no posts exist for this user yet
  console.log(`Fetched ${posts.length} posts for user ${userId}`);

  return res.status(200).json({
    success: true,
    message: "Posts fetched successfully",
    user,
    posts,
  });
});

export {
  createPost,
  deletePost,
  userPosts,
  allPosts,
  likePost,
  createComment,
  createReply,
  togglePostStatus,
  getPostsByUser
};