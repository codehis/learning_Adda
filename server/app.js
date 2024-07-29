const express=require("express")
const app=express()
const dotenv=require("dotenv");
dotenv.config({path:'./config.env'})
const Port=process.env.Port;
const mongoose=require('mongoose');
const cookieParser = require('cookie-parser')
const cors =require('cors');
app.use(cookieParser())
const cloudanary=require("cloudinary");
const Razorpay=require('razorpay')
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(
    cors({
      origin: [process.env.Fronted_url],
      credentials: true,
    })
  );

require("./DB/Connection")
const user=  require('./modes/schema')



const  userRoutes =require('./route/auth.js');
const courseRoutes =require('./route/courseRouter.js')
const paymentRoutes =require('./route/PaymentRouter.js') ;


app.use('/user', userRoutes);
app.use('/courses', courseRoutes);
app.use('/payments', paymentRoutes);


cloudanary.v2.config({
    cloud_name:process.env.cloudername,
    api_key:process.env.apikey,
    api_secret:process.env.apisecret
})





app.listen(Port,()=>{
    console.log(`this server is listen at ${Port} `)
})


