import dotenv from "dotenv";
import {app} from './app.js'
dotenv.config({
    path:'./.env'
});

import connectDB from "./db/db.js";

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at port : ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.log("MONGO db connection failed",err);
})


















/* import express from "express";
const app=express();

( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log(":Error",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is Listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ",error)
        throw err
    }
})()
*/