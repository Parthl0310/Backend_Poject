import {asynchandler} from "../utils/asynchandler.js"
import {apierror} from "../utils/apierror.js"
import {User} from "../models/user.models.js"
import {uploadoncloudinary} from "../utils/cloudnary.js"
import {apiresponse} from "../utils/apiresponse.js"
import cookieParser from "cookie-parser"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateaccessandrefreshtokens= async(userid)=>{
    try {
        const user=await User.findById(userid)
        const accesstoken=user.generateaccesstoken()
        const refreshtoken=user.generaterefreshtoken()

        console.log(accesstoken)
        user.refreshtoken=refreshtoken
        await user.save({validateBeforeSave : false})

        return {accesstoken,refreshtoken}


    } catch (error) {
        throw new apierror(500,"Something Went wrong While generating refresh and access token")
    }
}

const registeruser = asynchandler(async (req,res)=>{
    const {fullname,email,username,password}=req.body
    console.log("email",email);
    
    if(
        [fullname,email,username,password].some((field) => field?.trim() ==="")
    )
    {
        throw new apierror(400,"All fields are Required")
    }

    const existeduser=await User.findOne({
        $or: [{username},{email}]
    })

    if(existeduser){
        throw new apierror(409,"User with email or username already exists")
    }

    const avatarlocalpath=req.files?.avatar[0]?.path;
    const coverimagelocalpath=req.files?.coverimage[0]?.path;

    console.log(req.files)
    
    console.log(coverimagelocalpath)
    if(!avatarlocalpath){
        throw new apierror(400,"avatar local file is required")
    }
    
    const avatar=await uploadoncloudinary(avatarlocalpath)
    const coverimage=await uploadoncloudinary(coverimagelocalpath)
    console.log(coverimage?.url)
    
    if(!avatar){
        throw new apierror(400,"avatar file is required")
    }
    
    const user= await  User.create({
        fullname,
        avatar:avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createduser=await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if(!createduser){
        throw new apierror(500,"Something Went Wrong While registering the user")
    }

    return res.status(201).json(
        new apiresponse(200,createduser,"User Registered successfully")
    )

})

const loginuser=asynchandler(async (req,res)=>{
    const {email,username,password} = req.body

    if(!(email || username)){
        throw new apierror(400,"Username or email Is Required")
    }

    const user= await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new apierror(404,"User is not found");
    }
    const passwordcorrect =await user.ispasswordcorrect(password)
    
    if(!passwordcorrect){
        throw new apierror(401,"Password is Incorrect");
    }
    const {accesstoken,refreshtoken}=await generateaccessandrefreshtokens(user._id)

    console.log(accesstoken)
    
    const loggedinuser=await User.findById(user._id).select("-password -refreshtoken")
    console.log(loggedinuser)
    
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new apiresponse(200,{
            user:loggedinuser,accesstoken,refreshtoken
        },"user logged in successfully")
    )

})

const logoutuser=asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshtoken:undefined
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new apiresponse(200,{},"User Loggeed Out"))

})

const refreshaccesstoken=asynchandler(async(req,res)=>
    {
        const incomingrefreshtoken=req.cookie.refreshtoken || req.body.refreshtoken

        if(!incomingrefreshtoken){
            throw new apierror(401,"Authorized request")
        }

        try {
            const decodedtoken=jwt.verify(
                incomingrefreshtoken,
                process.env.REFRESH_TOKEN_SECRET || "1234"
            )
    
           const user=await User.findById(decodedtoken?._id)
    
            if(!user){
                throw new apierror(401,"Invalid refresh token")
            }
    
            if(incomingrefreshtoken !== user?.refreshtoken){
                throw new apierror(401,"refresh token is expired or user")
            }
    
            const options={
                httpOnly:true,
                secure:true
            } 
            const {accesstoken,newrefreshtoken}=await generateaccessandrefreshtokens(user._id)
            return res
            .status(200)
            .cookie("accesstoken",accesstoken,options)
            .cookie("refreshtoken",newrefreshtoken,options)
            .json(
                new apiresponse(200,
                    {accesstoken,refreshtoken:newrefreshtoken},
                    "access Token refreshed"
                )
            )
        } catch (error) {
            throw new apierror(401,error?.message || "Invalid refresh Token")
        }
    }
)

const changecurrentpassword=asynchandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    
    const user=await User.findById(req.user?._id)
    const ispasswordcorrect =await user.ispasswordcorrect(oldpassword)

    if(!ispasswordcorrect){
        throw new apierror(400,"Invalid old password")
    }

    user.password=newpassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new apiresponse(200,{},"Password Change successfully"))
})

const getcuurentuser=asynchandler(async(req,res)=>{
    return res.status(200)
    .json(new apiresponse(200,req.user,"current user fetched successfully"))
})

const updateaccountdetails=asynchandler(async(req,res)=>{
    const{fullname,email}=req.body

    if(!fullname || !email){
        throw new apierror(400,"All fields are required")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email,
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiresponse(200,user,"Account details updated successfully"))
})

const updateuseravatar=asynchandler(async(req,res)=>{
    const avatarlocalpath=req.file?.path

    if(!avatarlocalpath){
        throw new apierror(400,"Avatar file is missing")
    }

    const avatar=await uploadoncloudinary(avatarlocalpath)

    if(!avatar.url){
        throw new apierror(400,"Error while uploading on avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    res.status(200)
    .json(
        new apiresponse(200,user,"Avatar update successfully")
    )
})

const updateusercoverimage=asynchandler(async(req,res)=>{
    const coverimagelocalpath=req.file?.path

    if(!coverimagelocalpath){
        throw new apierror(400,"coverimage is not found")
    }

    const coverimage=await uploadoncloudinary(coverimagelocalpath)

    if(!coverimage.url){
        throw new apierror(400,"Error while uploading coverimage")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            coverimage:coverimage.url
        },
        {new:true}
    ).select("-password")

    
    res.status(200)
    .json(
        new apiresponse(200,user,"coverimage update successfully")
    )
})

const getuserprofile=asynchandler(async(req,res)=>{
    const{username}=req.params

    if(!username?.trim()){
        throw new apierror(400,"User name is missing")
    }

   const channel=await User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedto"
        }
    },
    {
        $addFields:{
            subscribercount:{
                $size:"$subscribers"
            },
            channelsubscribetocount:{
                $size:"$subscribedto"
            },
            issubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscribercount:1,
            channelsubscribetocount:1,
            issubscribed:1,
            avatar:1,
            coverimage:1,
            emmail:1
        }
    }
   ])
   console.log(channel);
    
   if(!channel?.length){
        throw new apierror(404,"channel does not exists")
    }

    return res.status(200)
    .json(
        new apiresponse(200,channel[0],"User channel fetched successfully")
    )
})

const getwatchhistory=asynchandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchhistory",
                foreignField:"_id",
                as:"watchhistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new apiresponse(
        200,
        user[0].watchhistory,
        "Watch hisotry  fetch successfully"
    ))
})

export {registeruser,
    loginuser,
    logoutuser,
    refreshaccesstoken,
    changecurrentpassword,
    getcuurentuser,
    updateaccountdetails,
    updateuseravatar,
    updateusercoverimage,
    getuserprofile,
    getwatchhistory
} 
