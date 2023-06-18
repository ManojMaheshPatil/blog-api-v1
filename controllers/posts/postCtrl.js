const Post = require("../../model/Post/Post");
const User = require("../../model/User/User");
const appErr = require("../../utils/appErr");


const createPostCtrl = async(req,res,next)=> {
    const {title,description,category} = req.body;
    try{
        // Find the user
        const author = await User.findById(req.userAuth);
        // check if the user is blocked
        if (author.isBlocked){
            return next(appErr("Access denied , account blocked",403));
        }
        // Create the post
        const postCreated = await Post.create({
            title,
            description,
            user: author._id,
            category,
            photo: req && req.file && req.file.path,
        });

        // Associate the user to the post , that is , push the post id into users posts field
        author.posts.push(postCreated);
        // save the user
        await author.save();
        res.json({
            status:"success",
            data:postCreated,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// all
const fetchPostsCtrl = async(req,res,next)=> {
    try{
        // FInd all posts
        const posts = await Post.find({}).populate("user").populate("category","title");

        // Check if the user is blocked by the post owner
        const filteredPosts = posts.filter(post=>{
            // get all blocked users
            const blockedUsers = post.user.blocked;
            const isBlocked = blockedUsers.includes(req.userAuth);

            return isBlocked ? null : post;
        })
        res.json({
            status:"success",
            data:filteredPosts,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// Toggle Likes
const toggleLikesPostCtrl = async(req,res,next)=> {  
    try{
        // 1. Get the post 
        const post = await Post.findById(req.params.id);
        //2. Check if user has already liked the post
        const isLiked = post.likes.includes(req.userAuth);
        //3. If the user has already liked the post , unlike the post
        if(isLiked){
            post.likes = post.likes.filter(like=>like.toString() !== req.userAuth.toString());
            await post.save();
        }else{
            // 4. If the user has not liked the pot , then like the post
            post.likes.push(req.userAuth);
            await post.save();
        }
        res.json({
            status:"success",
            data:"You have successfully liked the post",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// Toggle DisLikes
const toggleDisLikesPostCtrl = async(req,res,next)=> {  
    try{
        // 1. Get the post 
        const post = await Post.findById(req.params.id);
        //2. Check if user has already unliked the post
        const isUnLiked = post.dislikes.includes(req.userAuth);
        //3. If the user has already unliked the post , like the post
        if(isUnLiked){
            post.dislikes = post.dislikes.filter(dislike=>dislike.toString() !== req.userAuth.toString());
            await post.save();
        }else{
            // 4. If the user has not liked the pot , then like the post
            post.dislikes.push(req.userAuth);
            await post.save();
        }
        res.json({
            status:"success",
            data:post,
        });
    }catch(error){
        next(appErr(error.message));
    }
};


// single
const postDetailsCtrl = async(req,res,next)=> {
    try{
        // 1. Find the post
        const post = await Post.findById(req.params.id);
        // 2.   Check if user has already viewed this post or not
        const isViewed = post.numViews.includes(req.userAuth);
        if(isViewed){
            res.json({
                status:"success",
                data:post,
            });
        } else{
            // 3. Push the user into numViews
            post.numViews.push(req.userAuth);

            // 4. Save
            await post.save();
            res.json({
                status:"success",
                data:post,
            });
        }
        
    }catch(error){
        next(appErr(error.message));
    }
};

// delete
const deletePostCtrl = async(req,res,next)=> {
    try{
        // find the post
        const post = await Post.findById(req.params.id);
        // check if the user deleting the post is the one who created the post in the first place
        if(post.user.toString() !== req.userAuth.toString()){
            return next(appErr("You are not allowed to delete this post",403));
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({
            status:"success",
            data:"delete post route ",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// update
const updatePostCtrl = async(req,res,next)=> {
    const {title , description,category} = req.body;
    try{
        // find the post
        const post = await Post.findById(req.params.id);
        // check if the user updating the post is the one who created that post
        if(post.user.toString() !== req.userAuth.toString()){
            return next(appErr("You are not allowed to update this post",403));
        }
        await Post.findByIdAndUpdate(req.params.id,{
            title,
            description,
            category,
            photo: req?.file?.path,
        },{
            new : true,
        });
        res.json({
            status:"success",
            data: post,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

module.exports = {
    createPostCtrl,
    postDetailsCtrl,
    deletePostCtrl,
    updatePostCtrl,
    fetchPostsCtrl,
    toggleLikesPostCtrl,
    toggleDisLikesPostCtrl,
}