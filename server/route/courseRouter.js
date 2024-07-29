const express=require('express')
const router=express.Router();
const authenticate=require('../middleware/authentication');
const courseList=require('../modes/CoursModels')
const path =require('path');
const upload =require('../middleware/multer')

const cloudinary=require('cloudinary')
const isAdminLogin=require('../middleware/adminLogin')

const fs =require('fs/promises')
const AppError =require('../utils/AppError')
const {isLoggedIn ,authorizeRoles}=require('../middleware/authentication')



router.get('/getAllCourse',async(req,res,next)=>{

const Courses=await courseList.find({}).select('-lecture');

res.status(200).json({
    success:true,
    message:'all course',
    Courses
})

 

})
router.post('/createCourse', 
isLoggedIn,
authorizeRoles('ADMIN'),
upload.single('thumbnail'),
 async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  // if (!title || !description || !category || !createdBy) {
  //   return next(new AppError('All fields are required', 400));
  // }

  const course = await courseList.create({
    title,
    description,
    category,
    createdBy,
  });

  if (!course) {
    return next(
      new AppError('Course could not be created, please try again', 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms', // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      console.log(result)
      // After successful upload remove the file from local storage
      // fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      // for (const file of await fs.readdir('uploads/')) {
      //   await fs.unlink(path.join('uploads/', file));
      // }
console.log(error)
      // Send the error message
      return next(
        new AppError(
          JSON.stringify(error) || 'File not uploaded, please try again',
          400
        )
      );
    }
  }

  // Save the changes
  await course.save();

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
}
)



router.put('/updateCourse/:id',isLoggedIn,async(req,res)=>{


    try{
        const {id}=req.params;
        console.log(id)

// find the course Id in database CourseList collection

const course=await courseList.findByIdAndUpdate(
    id,
    {
        // set as courseList schema according to body
        $set:req.body
    },
    {
        runValidators:true
    }
)

// if course is not find 
if(!course){
    res.json({message:"course Id invalid"})
}
await course.save()

res.json({
    message:"course Details Update Successfully"
})

    }
    catch(e){
        console.log(e)
    }


})

router.delete('/courseDelete/:id',isLoggedIn,async(req,res)=>{
    const {id}=req.params;
    console.log(id)

    // check the course in database 
    const course=await courseList.findById(id)

    if(!course){
        res.json({messgae:"course not found"})
    }

    await course.deleteOne();

    res.json({message:"course delete successfully"})
})


router.post('/createCourseByID/:id',isLoggedIn,authorizeRoles('ADMIN'),async(req,res)=>{

    const{title,discription}=req.body;
    const{id}=req.params;



const lectureData={
    title,discription
}

 // here the upload the picture of tumbmail

 if(req.file){
    const result=await cloudanary.v2.uploader.upload(req.file.path, {
        folder: 'lms', // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
  
        lectureData.lectures.public_id = result.public_id;
        lectureData.lectures.secureUrl = result.secure_url;
      }
}

// push the course in lecture

course.lectures.push(lectureData);
course.numberOfLecture=course.lectures.length;


await course.save();


res.json({messgae:"course add by ID"})






})


router.get('/getlecture/:id',isLoggedIn,async(req,res)=>{
  const { id } = req.params;

  const course = await courseList.findById(id);
  console.log(course)
  if (!course) {
    return next(new AppError('Invalid course id or course not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Course lectures fetched successfully',
    lectures: course.lectures,
  });
})

router.post('/:id',upload.single('lecture'),async(req,res,next)=>{
  const { title, description } = req.body;
  const { id } = req.params;

  let lectureData = {};

  // if (!title || !description) {
  //   return next(new AppError('Title and Description are required', 400));
  // }

  const course = await courseList.findById(id);

  if (!course) {
    return next(new AppError('Invalid course id or course not found.', 400));
  }

  console.log(course)
  // Run only if user sends a file
  if (req.file) {
    try {
      
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'video', // Save files in a folder named lms
        chunk_size: 500000000, // 50 mb size
        resource_type: 'video',
      });

      console.log("result",result)
      // If success
      if (result) {
        // Set the public_id and secure_url in array
        lectureData.public_id = result.public_id;
        lectureData.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      for (const file of await fs.readdir('uploads/')) {
        await fs.unlink(path.join('uploads/', file));
      }

      // Send the error message
      return (
        console.log("video NOt Upoaded"),
        new AppError(
          JSON.stringify(error) || 'File not uploaded, please try again',
          400

        )
        
      );
    }
  }

  course.lectures.push({
    title,
    description,
    lecture: lectureData,
  });

  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Course lecture added successfully',
    course,
  });
})

router.post('/remove lecture',async(req,res)=>{
  const { courseId, lectureId } = req.query;

  console.log(courseId);

  // Checking if both courseId and lectureId are present
  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  if (!lectureId) {
    return next(new AppError('Lecture ID is required', 400));
  }

  // Find the course uding the courseId
  const course = await Course.findById(courseId);

  // If no course send custom message
  if (!course) {
    return next(new AppError('Invalid ID or Course does not exist.', 404));
  }

  // Find the index of the lecture using the lectureId
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError('Lecture does not exist.', 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: 'video',
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: 'Course lecture removed successfully',
  });
})

router.post('/lectureUpdate',async(req,res)=>{
  const { id } = req.params;

  // Finding the course using the course id
  const course = await Course.findByIdAndUpdate(
    id,
    {
      $set: req.body, // This will only update the fields which are present
    },
    {
      runValidators: true, // This will run the validation checks on the new data
    }
  );

  // If no course found then send the response for the same
  if (!course) {
    return next(new AppError('Invalid course id or course not found.', 400));
  }

  // Sending the response after success
  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
  });
})

router.post('/deleteCourse',async(req,res)=>{
  const { id } = req.params;

  // Finding the course via the course ID
  const course = await Course.findById(id);

  // If course not find send the message as stated below
  if (!course) {
    return next(new AppError('Course with given id does not exist.', 404));
  }

  // Remove course
  await course.remove();

  // Send the message as response
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
})
module.exports=router;

