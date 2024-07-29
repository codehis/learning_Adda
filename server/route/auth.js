const express=require("express")
const dotenv=require("dotenv");
const Userdata = require("../modes/schema");
const AppError=require('../utils/AppError')
const bcrypt=require('bcrypt');
const jwtoken=require("jsonwebtoken");
const authenticate=require('../middleware/authentication')
const cookieParser = require('cookie-parser')
const Crypto=require('crypto')
const upload=require('../middleware/multer');
const cloudanary=require('cloudinary')
const path =require("path");
const sendEmail=require('../utils/sendEmail')
const bodyparser=require('body-parser')
const {isLoggedIn} =require('../middleware/authentication')




const route=express.Router();
route.use(cookieParser())

route.use(bodyparser.json())
route.use(express.urlencoded({
    extended:true
}))

route.get("/",(req,res)=>{
    res.send("this is home Page ")
})

route.get('/userSuscriber',async(req,res)=>{

    const suscribUser=await Userdata.find({'subscription.status': 'active'})
 

 res.status(200).json({
    success:true,
    message:"suscribe user",
    suscribUser
})

   })

// route.get('/:_id',async(req,res)=>{

//     const {_id}=req.params
//     console.log(_id)
//     const userdetails=await Userdata.findById(_id)
//     res.status(200).json({
//         success:true,
//         userdetails
//     })
// })

route.get('/userDetails',isLoggedIn,async(req,res)=>{
  
    const userLogin= await Userdata.findById(req.user.id);
console.log(req.user.id)
//   console.log(userLogin)
    res.status(200).json({
      success: true,
      message: 'User details',
      userLogin,
    });
})
    // Finding the user using the id from modified req object
   

route.post("/createUser",async(req,res,next)=>{
    // route.post("/createUser",upload.single("avatar"),async(req,res)=>{
    /* when client send the data to the user in json form but our server not
understand the json form until we do not require or use bodyparser.json() in our 
program otherwise we get a typeerror like disstucture not follow property and we get 
undifine in conlose */ 
    
const { name, email, password,avatar } = req.body;

// Check if the data is there or not, if not throw error message
if (!name || !email || !password) {
  return next(new AppError('All fields are required', 400));
}

// Check if the user exists with the provided email
const userExists = await Userdata.findOne({ email });

// If user exists send the reponse
if (userExists) {
  return next(new AppError('Email already exists', 409));
}

// Create new user with the given necessary data and save to DB
const user = await Userdata.create({
  name,
  email,
  password,
  avatar
    
});

// If user not created send message response
if (!user) {
  return next(
    new AppError('User registration failed, please try again later', 400)
  );
}



// Save the user object
await user.save();

// Generating a JWT token
// const token = await user.generateJWTToken();

// Setting the password to undefined so it does not get sent in the response
// user.password = undefined;

// Setting the token in the cookie with name token along with cookieOptions
// res.cookie('token', token, cookieOptions);

// If all good send the response to the frontend
res.status(201).json({
  success: true,
  message: 'User registered successfully',
  user,
});
});

   
    

route.post("/login",async(req,res,next)=>{
  
// const {email,password}=req.body;
// console.log(email,password)


//     if(!email || !password){
//         res.status(201).json({message:"plz fill all details"})
//     }
    
    
//         // here we check the email is exist in database 
//         const userLogin= await Userdata.findOne({email:email})
       
//         // here we check the pass is correct or not 
//         if(userLogin){
//             const isMatch= await bcrypt.compare(password,userLogin.password);
    
//             // here we create a web token  for login porpose 
    
//             const token=await userLogin.genrateauthToken();
//             res.cookie("jwtoken",token,{
//                 expires:new Date(Date.now()+6600000),
//                 httpOnly:true
//               });
    
//         //    here we do how long user login after sometime user logout automatic by removing the tokenn
//     // here 120000 second after that time user logout from website automatic 
//         // res.cookie("jwtoken",token,{
          
//         //     httpOnly:true
//         // })
        
//             if(!isMatch){
//                 res.json({message:"invalid credential"})
//             }
//             else{
//                 res.status(200).json({
//                     success: true,
//                     message: 'User logged in successfully',
//                     userLogin,
//                   });
//             }
    
    
    
    
//         }
//         else{
//             res.send(201).json({
//                 success:false,
//                 message:"user Not Found"
//             })
//         }
    



const { email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!email || !password) {
    return next(new AppError('Email and Password are required', 400));
  }

  // Finding the user with the sent email
  const user = await Userdata.findOne({ email }).select('+password');

  // If no user or sent password do not match then send generic response
  if (!(user && (await bcrypt.compare(password,user.password)))) {
    return next(
      new AppError('Email or Password do not match or user does not exist', 401)
    );
  }

  // Generating a JWT token
  const token=await user.genrateauthToken();
            res.cookie("jwtoken",token,{
                expires:new Date(Date.now()+6600000),
                httpOnly:true
              });

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
//   res.cookie('token', token, cookieOptions);

  // If all good send the response to the frontend
  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    user,
  });



})
route.post("/logout",(req,res)=>{
    
res.clearCookie("jwtoken",{path:'/'})

res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });


})

route.get("/profile", isLoggedIn,async(req,res)=>{
    /* here we access the data from database we use middleware means when
    user wnat to see profile server check user login hai ki nhi this middleware

    */
   res.send(req.rootUser)


})
route.post('/forgetPasswrod',async(req,res)=>{

    const {email}=req.body;
    console.log(email)
    // check email
    if(!email){
        res.send("Email is required ")
    }

    // we here check the email present  in database 
    const user=await Userdata.findOne({email});
    console.log("userdata",user)

    if(!user){
        res.send("user not exist ")
    }

    // here we genrate the reset token
    const resetToken=await user.genratereatePassword();
    console.log("resetToken",resetToken)
    // here we save the reset token in database 
    await user.save();

    const resetUrl=`${process.env.Fronted_url}/forgetPasswrod/${resetToken}`
const subject='reset password';
const message=`you can reset your password by clicking <a hreg= ${resetUrl}`
console.log(resetUrl)
    // SEND THE EMAIL 
try{
  
        await sendEmail(email,subject,message);
console.log(email)
        res.status(200).json({
            success:true,
            message:`Reset password token has been sent to ${email} successfull`
        })
        
}catch(e){

        user.forgetPasswordExpiry=undefined;
        user.forgetPasswordToken=undefined;

        await user.save();
        console.log(e)
        res.json({message :"Some thing error in reset password link"})
    }

})
route.post('/forgetPasswrod/:resetToken',async(req,res)=>{


    try{
        const {resetToken}=req.params;
        console.log(resetToken)
        const {password}=req.body;
        
         
        const forgetPasswordToken=Crypto.createHash('sha256').update(resetToken).digest('hex');
        
        const user=await Userdata.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry:{$gt:Date.now()}
        })
        if(!user){
            res.json({message:"token is in valid  or expired"})
        }
        
        // if user exist then here we replace the od password to current password 
        user.password=password;
        user.forgetPasswordToken=undefined;
        user.forgetPasswordExpiry=undefined;
        
        
        user.save()
        
        res.status(200).json({
            success:true,
            message:"password change successfully"
        })
        
        
    }
    catch(e){
        console.log(e)
    }

})

route.post('/changePassword',async(req,res,next)=>{

    try{
        const {oldPassword,newPassword}=req.body;
        const{id}=req.userRoot;
        console.log(id)

    if(!oldPassword || !newPassword){
        res.json({message :"Fill both credentials"})
    }


    // here we check the old password is correct or not 

    const user=await Userdata.findById(id).select('+password')

    if(!user){
        res.jons({"message":"user not valid"})
    }

    const isPasswordVaid=await user.comparePassword(oldPassword);

    if(!isPasswordVaid){
        res.jons({message:"old password id not same enter valid password "})
    }

    user.password=newPassword;

    await user.save();
    user.password=undefined;

    res.status(200).json({
        message:"password update successs"
    })



    
    }catch(e){
        console.log(e);
    }

  
  })
route.put('/updateProfile' ,isLoggedIn,async(req,res,next)=>{


            const{name,avatar,id}=req.body;
            
            
        
            const user = await Userdata.findById(id);
        
          if (!user) {
            res.json({message:"user not Exist"})
          }
          
          user.name=name;
          user.avatar=avatar;
        
          
          
        
        
        
           
        
          // Save the user object
          await user.save();
        
          res.status(200).json({
            success: true,
            message: 'User details updated successfully',
            user
          });
        
        
        })

    
module.exports=route