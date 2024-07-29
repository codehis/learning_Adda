const jwtoken=require("jsonwebtoken");
const adminDATA=require("../modes/adminScema");

// cookies parser is used to send the cookie token from frontend to backend

const adminLogin=async (req,res,next)=>{
try{
    // here we access website token
    const token=req.cookies.jwtoken;
    // here we verify to our token 
    const verifyToken=jwtoken.verify(token,process.env.SECURITY_KEY);

    console.log(token);
    console.log(verifyToken);

    // here we find the user by using the token 
    const rootAdmin=await adminDATA.find({_id:verifyToken,"tokens.token":token});
    if(!rootAdmin){
        throw new error("User not found")
    }
   
    
        req.rootAdmin=token;
        req.rootAdmin=rootAdminj;
        req.AdminID=rootAdmin._id;
        next();

    
  

}
catch(err){
res.status(401).send("Unauthorize token provided")
console.log(err);

}

}

module.exports= adminLogin;



