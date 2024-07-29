const mongoose=require('mongoose');
const jwtoken=require('jsonwebtoken')


const adminSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})



// here we genrate the token by using jsonwebtoken package 
adminSchema.methods.genrateauthToken=async function(){
    try{
        // here we create a token or we can say this is token code 
let token=jwtoken.sign({_id:this._id},process.env.SECURITY_KEY); 
// here we add in userSchema we say concate in userSchema
this.tokens=this.tokens.concat({token:token});
// we save the token permanently in databse 
 await this.save()
 return token;

    }catch(ee){
console.log(ee)
    }
}

const adminDATA=mongoose.model("adminDetails",adminSchema);


module.exports=adminDATA;