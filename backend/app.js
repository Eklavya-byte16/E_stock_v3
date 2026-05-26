import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from 'cookieParser'

const app = express();

app.use(cors({
     origin: process.env.FRONTEND_URL || "http://localhost:5173/",
     methord : ['POST', 'GET'],
     credentials: true,
     optionsSuccessStatus: 200,
     allowedHeaders: ['content-Type', 'Authorization']
     }));
app.use(cookieParser())
app.use(express.json());


export {app}