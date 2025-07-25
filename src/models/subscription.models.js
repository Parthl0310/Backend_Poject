import mongoose,{Schema} from "mongoose";

const subscriptionschema=new Schema({
    subscriber:{
        types: Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        types: Schema.Types.ObjectId,
        ref:"User"
    }
    },
    {timestamps:true}
)

export const Subscription=mongoose.model("Subscription",subscriptionschema)