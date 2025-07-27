import { Router } from "express";
import { registeruser,
    loginuser,
    logoutuser,
    refreshaccesstoken,
    changecurrentpassword, 
    getcuurentuser, 
    updateaccountdetails, 
    updateuseravatar, 
    updateusercoverimage, 
    getuserprofile, 
    getwatchhistory } from "../controllers/user.controller.js";
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
router.route("/change-password").post(verifyJWT,changecurrentpassword),
router.route("/Current-user").get(verifyJWT,getcuurentuser),
router.route("/update-account").patch(verifyJWT,updateaccountdetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateuseravatar),
router.route("/cover-image").patch(verifyJWT,upload.single("coverimage"),updateusercoverimage),
router.route("/c/:username").get(verifyJWT,getuserprofile)
router.route("/history").get(verifyJWT,getwatchhistory)

export default router