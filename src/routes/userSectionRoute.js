// routes/userRoutes.js
import { Router } from "express";
import { cityBaes, homeFeatured, homeStayTypes } from "../controllers/userPage/user.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Apply verifyJWT middleware globally to all routes in this file
// router.use(verifyJWT);

router.route("/feature").get(homeFeatured);
router.route("/stay_types").get(homeStayTypes);
router.route("/city_based").get(cityBaes);


export default router;
