// routes/userRoutes.js
import { Router } from "express";
import { get_all_notification } from "../controllers/notification/notification.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Apply verifyJWT middleware globally to all routes in this file
// router.use(verifyJWT);

router.route("/display_all_notification").get(get_all_notification);
// router.route("/display_user_notification").get(get_user_notification);
// router.route("/stay_types").get(homeStayTypes);
// router.route("/city_based").get(cityBaes);
// router.route("/top_review").get(topReview);

// router.route("/search_result").get(searchResult);


export default router;
