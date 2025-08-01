import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userschema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,
            required:true,
        },
        coverimage:{
            type:String,
        },
        watchhistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password Is Required']
        },
        refreshtoken:{
            type:String
        }
    },{timestamps:true}
)

userschema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password =await  bcrypt.hash(this.password,10)
    next()
})

userschema.methods.ispasswordcorrect = async function (password){
   return await bcrypt.compare(password,this.password)
}

userschema.methods.generateaccesstoken=function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET || 'parth123',{
            expiresIn:"1d"
        }
    )
}
userschema.methods.generaterefreshtoken=function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET || '1234',{
            expiresIn:"3d"
        }
    )
}

export const User=mongoose.model("User",userschema)