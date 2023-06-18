const Comment = require("../../model/Comment/Comment");
const Post = require("../../model/Post/Post");
const User = require("../../model/User/User");
const appErr = require("../../utils/appErr");

// create
const createCommentCtrl = async(req,res,next)=> {
    const {description} = req.body;
    try{
        // Find the post
        const post = await Post.findById(req.params.id);
        // create comment
        const comment = await Comment.create({
            post: post._id,
            description,
            user: req.userAuth
        });
        // push the comment into the post
        post.comments.push(comment._id);
        // Find the user
        const user = await User.findById(req.userAuth);
        // push the comment into the user
        user.comments.push(comment._id);
        // save
        // disable validation
        await post.save({validateBeforeSave:false});
        await user.save({validateBeforeSave:false});
        res.json({
            status:"success",
            data: comment,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// delete
const deleteCommentCtrl = async(req,res,next)=> {
    try{
        // find the comment
        const comment = await Comment.findById(req.params.id);
        // check if the user deleting the comment is the one who created the comment in the first place
        if(comment.user.toString() !== req.userAuth.toString()){
            return next(appErr("You are not allowed to delete this comment",403));
        }
        await Comment.findByIdAndDelete(req.params.id);
        res.json({
            status:"success",
            data:"Comment has been deleted successfully",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// update
const updateCommentCtrl = async(req,res,next)=> {
    const { description } = req.body;
    try{
        // find the comment
        const comment = await Comment.findByIdAndUpdate(req.params.id , {description} , {new:true, runValidators:true});
        // check if the user updating the comment is the one who created the comment in the first place
        if(comment.user.toString() !== req.userAuth.toString()){
            return next(appErr("You are not allowed to update this comment",403));
        }
        
        res.json({
            status:comment,
            data:"update comments route ",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

module.exports = {
    createCommentCtrl,
    deleteCommentCtrl,
    updateCommentCtrl,
}