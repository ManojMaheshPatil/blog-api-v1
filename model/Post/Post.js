const mongoose = require('mongoose');

//create schema
const postSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true , "Post title is required"],
        trim: true,
    },
    description:{
        type: String,
        required: [true , "Description is required"],
        trim: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required: [true , "Post Category required"],
    },
    numViews:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    dislikes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"Post Author is required"],
    },
    photo:{
        type:String,
        required:[true,"Post Image is required"],
    },
},{
    timestamps: true,
    toJSON: {virtuals:true},
}
);

// Hook
postSchema.pre(/^find/,function(next){ // /^find/ is regex to accept both find and findOne
    // add viewsCount as virtual field
    postSchema.virtual("viewsCount").get(function(){
        return this.numViews.length;
    });
    // add likesCount as virtual field
    postSchema.virtual("likesCount").get(function(){
        return this.likes.length;
    });
    // add dislikesCount as virtual field
    postSchema.virtual("dislikesCount").get(function(){
        return this.dislikes.length;
    });
    // check the most liked post in percentage
    postSchema.virtual("likesPercentage").get(function(){
        const total = +this.likes.length + +this.dislikes.length; // adding + infront of the var is same as converting to nums using Number() keyword
        const percentage = (this.likes.length/total)*100;
        return `${percentage}%`;
    });
    // check the most disliked post in percentage
    postSchema.virtual("dislikesPercentage").get(function(){
        const total = +this.likes.length + +this.dislikes.length; // adding + infront of the var is same as converting to nums using Number() keyword
        const percentage = (this.dislikes.length/total)*100;
        return `${percentage}%`;
    });

    // if days is less than 0 return Today if days is less than 1 return Yesterday if days is >1 return days ago
    postSchema.virtual("daysAgo").get(function(){
        const post = this;
        const date = new Date(post.createdAt);
        const daysAgo = Math.floor((Date.now()-date)/86400000);
        return daysAgo===0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
    });
    next();
});

// Compile the posy model

const Post = mongoose.model("Post",postSchema);
module.exports = Post;