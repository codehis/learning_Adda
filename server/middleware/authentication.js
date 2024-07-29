
const jwt=require('jsonwebtoken')
const Userdata =require('../modes/schema.js')


const AppError =require('../utils/AppError.js')
const asyncHandler=require('./asyncHandler.middleware.js')


 const isLoggedIn = asyncHandler(async (req, _res, next) => {
  // extracting token from the cookies
  const  token  = req.cookies.jwtoken;

  console.log(token)
  // If no token send unauthorized message
  if (!token) {
    return next(new AppError("Unauthorized, please login to continue", 401));
  }

  // Decoding the token using jwt package verify method
  const decoded = await jwt.verify(token, process.env.SECURITY_KEY);

  // If no decode send the message unauthorized
  if (!decoded) {
    return next(new AppError("Unauthorized, please login to continue", 401));
  }


  const rootUser=await Userdata.findOne({_id:decoded});
  // If all good store the id in req object, here we are modifying the request object and adding a custom field user in it
//  user data from id 
  req.user = rootUser;
 
 
// console.log("rootUser",rootUser.)

  // Do not forget to call the next other wise the flow of execution will not be passed further
  next();
});

// Middleware to check if user is admin or not
const authorizeRoles = (...role) =>
  asyncHandler(async (req, _res, next) => {
    // console.log("user",req.user.role)
    if (!role.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to view this route", 403)
      );
    }

    next();
  });

// Middleware to check if user has an active subscription or not
const authorizeSubscribers = asyncHandler(async (req, _res, next) => {
  // If user is not admin or does not have an active subscription then error else pass
  if (req.user.role !== "ADMIN" && req.user.subscription.status !== "active") {
    return next(new AppError("Please subscribe to access this route.", 403));
  }

  
  next();
});


module.exports = {
  authorizeRoles,
  authorizeSubscribers,
  isLoggedIn
};
