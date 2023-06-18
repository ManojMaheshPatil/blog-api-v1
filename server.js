const express = require("express");
const userRouter = require("./routes/users/userRoutes");
const postRouter = require("./routes/posts/postRoutes");
const categoryRouter = require("./routes/categories/categoryRoutes");
const commentRouter = require("./routes/comments/commentRoutes");
const globalErrHandler = require("./middlewares/globalErrHandler");
const isAdmin = require("./middlewares/isAdmin");
require("dotenv").config();
require('./config/dbConnect');
const app = express();


//middlewares
app.use(express.json()); // parse incoming payload

// app.use(isAdmin);
//Routes

// Users routes
app.use("/api/v1/users/",userRouter);

// Posts Routes
app.use("/api/v1/posts/",postRouter);


// Comments Routes
app.use("/api/v1/comments/",commentRouter);

// Category Routes
app.use("/api/v1/categories/",categoryRouter);

// Error handlers middleware 

app.use(globalErrHandler);

// 404 error

app.use("*",(req,res)=>{
    console.log(req.originalUrl);
    res.status(404).json({
        message: `${req.originalUrl} - Route not found`,
    });
});

// Listen to server
const PORT = process.env.PORT || 9000;
app.listen(PORT,console.log(`Server is up and running on port ${PORT}`));

