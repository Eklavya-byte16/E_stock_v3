import { app } from "./app.js";
import mongoose from "mongoose";
import 'dotenv/config';

const DevlopmentPORT = process.env.PORT || 3000
const BaseUrl = process.env.BD_BASEURL
const Node_env = process.env.ENV || "devlopment"

// Database connection
// Get differnt info about the states
// Genrate the mean whan db connencton should removed

const connectDATABASE = async()=>{
    try {
       await mongoose.connect(BaseUrl, {
            serverSelectionTimeoutMS: 5000,
            retryWrites: true,
            maxPoolSize: 10,
        });
        console.log("DB Connected");
        return true;
    } catch (error) {
        console.log("Fail , retrying...");
        setTimeout(()=> connectDATABASE(), 5000);
        return false;
    }
}

mongoose.connection.on('connected', ()=>{
    console.log("connect to cluster");
});

mongoose.connection.on('error', (error)=>{
    console.log("mongoDB connection Error:- ", error.message)
})

mongoose.connection.on('disconnected', ()=>{
    console.log("mongoDB connection disconnected");
})

mongoose.connection.on('reconnected', ()=>{
    console.log("mongoDB connection reconnected");
    
})

const GentalShutDown= async ()=>{
try {
    mongoose.connection.close();
    serverConnection.close(()=>{
        process.exit(1);
    })
} catch (error) {
    console.log("Error in GentalShutDown:- ", error);
    process.exit(1);
}
}

process.on("SIGTERM",GentalShutDown)
process.on("SIGINT",GentalShutDown)


const serverConnection = ()=>{
   try {
     const connectDATABASE_Status = await connectDATABASE();
     if(!connectDATABASE_Status) {
         console.log("DataBase connencton error, failed to connect");
     }
 
     const server = app.listen(DevlopmentPORT, ()=>{
       console.log("connected DataBase..");
       console.log("Server Started..");
     })
     return server;
   } catch (error) {
    console.log("failed to start");
    console.log("server Error:- " , error.message);
    process.emit(1);
   }

   global.Server = await serverConnection();
}

await serverConnection();

return {app}