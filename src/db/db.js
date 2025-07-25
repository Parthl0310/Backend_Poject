import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB=async () =>{
    try{
        const connctionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host ${connctionInstance.connection.host}`)
    }
    catch(error){
        console.log("MONGODB connction error",error);
        process.exit(1)
    }
}

export default connectDB