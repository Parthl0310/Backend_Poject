import mongoose, { Schema } from "mongoose";


const likeschema=new Schema(
    {
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        comment:{
            type:Schema.Types.ObjectId,
            ref:"Comment"
        },
        tweet:{
            type:Schema.Types.ObjectId,
            ref:"Tweet"
        },
        likedby:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
        
    },{
        timestamps:true
    }
)

export const Like=mongoose.model("Like",likeschema)