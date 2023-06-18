const mongoose =require('mongoose');

// function to connect

const dbConnect = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URL)
    }catch(error){
        console.log(error.message);
        process.exit(1);
    }
}

dbConnect();