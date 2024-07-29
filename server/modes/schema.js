const mongoose=require('mongoose');
const bcrypt=require('bcrypt')
const jwtoken=require('jsonwebtoken');
const crypto=require('crypto')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'name is required'],
        minLength:[2,'plzse give proper name ']
    },
    email:{
        type:String,
        required:[true,'email is required'],
        unique:true,
       

    },
    
    password:{
        type:String,
        required:true
    },
    avatar:{
        type:String
    }
    // avatars:{
    //     public_id:{
    //         type:String,

    //     },
    //     secure_url:{
    //         type:String
    //     }
    // },
   ,
    subscription: {
        id: String,
        status: String,
      },
     
      role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER',
      },
    
    tokens:[
        {
            token:{
                type:String,
                required:true

            }
        }
    ]
,
date:{
    type:Date,
    default:Date.now
  },

  
    forgetPasswordToken:String,
    forgetPasswordExpiry:Date


})

// here we are going to hash our password using bcrypt package 

userSchema.pre('save',async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
       
    }
    next()
} )

// here we genrate the token by using jsonwebtoken package 
userSchema.methods.genrateauthToken=async function(){
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
// here we genrate the token for reset the password 
userSchema.methods.genratereatePassword=async function(){
    const resetToken=crypto.randomBytes(20).toString('hex');

    // store the database 
    this.forgetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.forgetPasswordExpiry=Date.now()+ 15 *  60 * 1000;  
    // after 15 min token expire


    return resetToken;

}

userSchema.methods.addmessage=async function(name,email,message){
    try{
      // we by the addmessage function adding the details in database by concate function
      this.messages=this.messages.concat({name,email,message});
      // after that we save by save method
      await this.save();
      return this.messages;
  
    }
    catch(err){
  console.log(err)
    }
  }

// here models means we create a collection AND IF PROGRAMMER CAN ABE TO CREATE A COLLECTION FROM HERE WHENEVER SERVER START

const Userdata=mongoose.model("USER",userSchema);

module.exports=Userdata;




