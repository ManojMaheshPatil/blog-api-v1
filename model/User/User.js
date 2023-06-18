const mongoose = require('mongoose');
const Post = require("../Post/Post");

// create user schema
const userSchema = new mongoose.Schema({
    firstName : {
        type: String,
        required: [true , "First Name is required"],
    },
    lastName : {
        type: String,
        required: [true , "Last Name is required"],
    },
    profilePhoto : {
        type: String,
    },
    email:{
        type: String,
        required: [true , "Email is required"],
    },
    password:{
        type: String,
        required: [true , "Password is required"],
    },
    isBlocked:{
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    role:{
        type: String,
        enum: ["Admin","Guest","Editor"],
    },
    viewers:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    followers:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
    ],
    following:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Post",
        }
    ],
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Comment",
        }
    ], 
    blocked:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Post",
        }
    ],
    // plan:
    //     {
    //         type: String,
    //         enum: ['Free','Premium','Pro'],
    //         default: 'Free',
    //     },
    userAward: {
        type: String,
        enum: ['Bronze','Silver','Gold'],
        default: 'Bronze',
    }
},{
    timestamps: true,
    toJSON: {virtuals:true},
}
);

// Hooks
// 1. Pre Hook : We use this before record is saved . For eg when we use find,findOne , findById etc etc
userSchema.pre("findOne" , async function(next){
    // populate the post
    this.populate({
        path: "posts",
    });
    // 1. Get the user id
    // console.log(this);
    const userId = this._conditions._id;
    // to know why we used ._conditions , do "console.log(this)" and check out the /profile endpoint in thunderclient

    // 2. Find the post created by the user
    const posts = await Post.find({ user: userId });

    // 3. Get the last post created by the user
    const lastPost = posts[posts.length-1];

    // 4. Get the last post date
    const lastPostDate = new Date(lastPost && lastPost.createdAt);

    // 5. Get the last post date in string format
    const lastPostDateStr = lastPostDate.toDateString();

    // 6. Add it as a virtual property to the User model
    userSchema.virtual("lastPostDate").get(function(){
        return lastPostDateStr;
    });

    // --------------- Check if the user is inactive for 30 days -------------------------

    // get current date
    const currentDate = new Date();

    // get the diff between current date and last post date
    const diff = currentDate - lastPostDate;

    // get the difference in days
    const diffInDays = diff / (1000*3600*24);

    if (diffInDays > 30){
        // add virtuals "isInactive" to the schema to check if user is inactive for 30 days
        userSchema.virtual("isInactive").get(function(){
            return true;
        });
        // Find the user by ID and update
        await User.findByIdAndUpdate(userId,{isBlocked: true},{new: true});
    }else{
        userSchema.virtual("isInactive").get(function(){
            return false;
        });
        // Find the user by ID and update
        await User.findByIdAndUpdate(userId,{isBlocked: false},{new: true});
    }

    // ----------- Last Active Date ------------------------------
    // convert to daysAgo , for eg 1 day ago
    const daysAgo = Math.floor(diffInDays);
    // add vituals lastActive in days to the userschema
    userSchema.virtual("lastActive").get(function(){
        // check if daysAgo is < 0
        if (daysAgo<=0){
            return "Today";
        }
        if (daysAgo == 1){
            return "Yesterday";
        }
        if (daysAgo>1){
            return `${daysAgo} days ago`;
        }
    });

    // Update user awards based on the number of posts
    // get the number of posts
    const numberOfPosts = posts.length;

    // check if the number of posts is lesser than 10
    if (numberOfPosts<10){
        await User.findByIdAndUpdate(
            userId,
            {
                userAward:"Bronze",
            },
            {
                new: true,
            }
        );
    }

    // check if the number of posts is greater than 10
    if (numberOfPosts>10){
        await User.findByIdAndUpdate(
            userId,
            {
                userAward:"Silver",
            },
            {
                new: true,
            }
        );
    }

    // check if the number of posts is greater than 20
    if (numberOfPosts>20){
        await User.findByIdAndUpdate(
            userId,
            {
                userAward:"Gold",
            },
            {
                new: true,
            }
        );
    }



    next();
});

// 2. Post Hook : We use this after saving . For eg when we use .save()
// userSchema.post("save",function(doc,next){  // DO NOT FORGET TO USE doc , if you dont it will give a big error
//     console.log("Post Hook has been called");
//     next();
// });

// Get full name
userSchema.virtual("fullname").get(function(){
    return `${this.firstName} ${this.lastName}`;
})

// Get initials

userSchema.virtual("initials").get(function(){
    return `${this.firstName[0]}${this.lastName[0]}`;
})

// Get posts count

userSchema.virtual("postCounts").get(function(){
    return this.posts.length;
})

// Get followers count

userSchema.virtual("followersCount").get(function(){
    return this.followers.length;
})

// Get following count

userSchema.virtual("followingCount").get(function(){
    return this.following.length;
})

// Get viewers count

userSchema.virtual("viewersCount").get(function(){
    return this.viewers.length;
})

// Get blocked count

userSchema.virtual("blockedCount").get(function(){
    return this.blocked.length;
})

// Compile the user model

const User = mongoose.model("User",userSchema);
module.exports = User;


