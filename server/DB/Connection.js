const mongoose=require('mongoose');


db=process.env.db


mongoose.connect(db).then(()=>{
    console.log("database connection successfull")
}).catch((e)=>{
    console.log("connecion not succesfull")
})