

import { Router } from "express";
import { getChatMessages, sendMessage, markMessagesAsRead } from "../controllers/chatController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT Middleware

const router = Router();

// Apply JWT Authentication Middleware
router.use(verifyJWT);


// Get chat messages for a booking
router.route("/:bookingId")
    .get(getChatMessages);

// Send a message in a chat
router.route("/:bookingId/send")
    .post(sendMessage);

// Mark messages as read
router.route("/:bookingId/read")
    .put(markMessagesAsRead);

export default router;
