import { Router } from "express";
import { registeruser,loginuser,logoutuser,refreshaccesstoken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
            
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),registeruser
)

router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT,logoutuser)
router.route("/refresh-token").post(refreshaccesstoken)

export default router