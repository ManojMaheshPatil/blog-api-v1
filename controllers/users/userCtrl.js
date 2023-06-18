const bcrypt = require('bcryptjs');
const User = require("../../model/User/User");
const generateToken = require('../../utils/generateToken');
const getTokenFromHeader = require('../../utils/getTokenFromHeader');
const appErr = require('../../utils/appErr');
const Category = require("../../model/Category/Category");
const Comment = require("../../model/Comment/Comment");
const Post = require('../../model/Post/Post');

// Register
const userRegisterCtrl = async(req, res, next)=> {
    const {firstName , lastName, email,password} = req.body;
    try{
        // Check if email exists
        const userFound = await User.findOne({email});
        if(userFound){
            return next(appErr("User Already Exists",500));
        }

        // hash password

        const salt = await bcrypt.genSalt(10); // 10 is the recommended number
        const hashedPassword = await bcrypt.hash(password,salt);

        // create user
        const user = await User.create({
            firstName, 
            lastName,
            email,
            password : hashedPassword,
        })
        res.json({
            status:"success",
            data:user,
        });
    }catch(error){
        console.log(error);
        next(appErr("Could not create user"));
    }
};


// Login
const userLoginCtrl = async(req,res,next)=> {
    const { email,password } = req.body;
    try{
        // Check if email exists
        const userFound = await User.findOne({email});

        if( !userFound ){
            return next(appErr("invalid login credentials"));
        }
        
        //verify password 
        const isPasswordMatched = await bcrypt.compare(password,userFound.password);

        if( !isPasswordMatched){
            if( !userFound ){
                return next(appErr("invalid login credentials"));
            }
        }
        res.json({
            status:"success",
            data: {
                firstName: userFound.firstName,
                lastName: userFound.lastName,
                email: userFound.email,
                isAdmin: userFound.isAdmin,
                token: generateToken(userFound._id),
            },
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// who viewed my profile

const whoViewedMyProfile = async(req,res,next)=> {
    try{
        //1. Find the original user
        const user = await User.findById(req.params.id);
        //2. Find the user who viewed the profile
        const userWhoViewed = await User.findById(req.userAuth);

        //3. Check if the original and who viewed users are not none
        if(user && userWhoViewed){
            //4. check if userWhoViewed is already in the user viewers array
            const isUserAlreadyViewed = user.viewers.find(viewer=>viewer.toString()===userWhoViewed._id.toJSON());
            if (isUserAlreadyViewed){
                return next(appErr("You already viewed this profile"));
            }else{
                //5. Push the useWhoViewed to the user's viewers array
                user.viewers.push(userWhoViewed._id);
                //6. Save the user
                await user.save();
                res.json({
                    status:"success",
                    data:"You have successfully viewed this profile",
                });
            }  
        }
    }catch(error){
        next(appErr(error.message));
    }
};

// following
const followingCtrl = async(req,res,next)=> {
    try{
        //1. Find the user to follow
        const userToFollow = await User.findById(req.params.id);
        //2. Find the user who is following
        const userWhoFollowed = await User.findById(req.userAuth);

        //3. Check if user and userwhofollowed are found
        if(userToFollow && userWhoFollowed){
            //4. Check if usewhofollowed is alread in user's followers array
            const isUserAlreadyFollowed = userToFollow.following.find(follower=>follower.toString()===userWhoFollowed._id.toString());
            if(isUserAlreadyFollowed){
                return next(appErr("You already followed this user"));
            }else{
                //5. push userwhofollowed into the user's followers array
                userToFollow.followers.push(userWhoFollowed._id);
                //6. push usertofollow to the userwhofollowed's following array
                userWhoFollowed.following.push(userToFollow._id);

                // 7. save
                await userWhoFollowed.save();
                await userToFollow.save();
                res.json({
                    status:"success",
                    data:"you have successfully followed this user ",
                });
            }
        }
    }catch(error){
        next(appErr(error.message));
    }
};

// unfollow
const unFollowCtrl = async(req,res,next)=> {
    try{
        // 1. Find  the user to unfollow
        const userToBeUnfollowed = await User.findById(req.params.id);
        // 2. Find the user who is unfollowing
        const userWhoUnFollowed = await User.findById(req.userAuth);
        //3. Check if user and userwhounfollowed are found
        if (userWhoUnFollowed && userToBeUnfollowed){
            //4. Check if userWhoUnFollowed is already in the user's followers array
            const isUserAlreadyFollowed = userToBeUnfollowed.followers.find(follower=>follower.toString() === userWhoUnFollowed._id.toString());
            if (!isUserAlreadyFollowed){
                return next(appErr("You have not followed this user!!!"));
            }else{
                // 5. Remove userwhounfollowed from user's follower's array
                userToBeUnfollowed.followers = userToBeUnfollowed.followers.filter(follower=>follower.toString()!==userWhoUnFollowed._id.toString());
                //6. save the user
                await userToBeUnfollowed.save();
                //7. Remove usertobeunfollowed from userwhounfollowed's following array
                userWhoUnFollowed.following=userWhoUnFollowed.following.filter(following=>following.toString() !== userToBeUnfollowed._id.toString());
                //8. save the user;
                await userWhoUnFollowed.save();
                res.json({
                    status:"success",
                    data:"you have successfully unfollowed this user",
                });
            }
        }
    }catch(error){
        next(appErr(error.message));
    }
};


// all
const usersCtrl = async(req,res,next)=> {
    try{
        const users = await User.find();
        res.json({
            status:"success",
            data:users,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// block
const blockUsersCtrl = async(req,res,next)=> {
    try{
        //1. Find the user to be blocked
        const userToBeBlocked = await User.findById(req.params.id);
        //2. Find the user who is blocking
        const userWhoBlocked = await User.findById(req.userAuth);
        //3. Check if userToBeBlocked and userWhoBlocked are found
        if(userWhoBlocked && userToBeBlocked){
            //4. Check if userToBeBlocked is already in userWhoBlocked's blocked array
            const isAlreadyBlocked = userWhoBlocked.blocked.find(blocked=>blocked.toString() === userToBeBlocked._id.toString());
            if(isAlreadyBlocked){
                return next(appErr("You have already blocked this user"));
            }
            //7. Push the id of usertobeblocked into userwhoblocked's blocked array
            userWhoBlocked.blocked.push(userToBeBlocked._id);
            //8. save
            await userWhoBlocked.save(); // you dont need to save usertobeblocked because you dont do anything to that array
            res.json({
                status:"success",
                data:"You have successfully blocked this user",
            });
        }
    }catch(error){
        next(appErr(error.message));
    }
};

// unblock
const unblockUserCtrl = async(req,res,next)=> {
    try{
        //1. Find the user to be unblocked
        const userToBeUnBlocked = await User.findById(req.params.id);
        //2. Find the user who is unblocking
        const userWhoUnBlocked = await User.findById(req.userAuth);
        //3. Check if userToBeBlocked and userWhoBlocked are found
        if(userWhoUnBlocked && userToBeUnBlocked){
            // 4. Check if usertobeunblocked is in the blocked array of userwhounblocked or not
            const isUserAlreadyBlocked = userWhoUnBlocked.blocked.find(blocked=>blocked.toString() === userToBeUnBlocked._id.toString());
            if(!isUserAlreadyBlocked){
                return next(appErr("You have not blocked this user"));
            }
            // 5. Remove the user to be unblocked from the main user's blocked array
            userWhoUnBlocked.blocked = userWhoUnBlocked.blocked.filter(blocked=>blocked.toString()!==userToBeUnBlocked._id.toString());
            // 6. Save
            userWhoUnBlocked.save();
            res.json({
                status:"success",
                data:"You have successfully unblocked this user",
            });
        }
    }catch(error){
        next(appErr(error.message));
    }
};

// admin-block
const adminBlockUserCtrl = async(req,res,next)=> {
    try{
        //1. find the user to be blocked
        const userToBeBlocked = await User.findById(req.params.id);
        //2. Check if user found
        if (!userToBeBlocked){
            return next(appErr("User not found"));
        }
        //3. change the isBlocked property to true
        userToBeBlocked.isBlocked = true;
        //4. save
        userToBeBlocked.save();
        res.json({
            status:"success",
            data:"You have successfully blocked this user",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// admin-block
const adminUnBlockUserCtrl = async(req,res,next)=> {
    try{
        //1. find the user to be blocked
        const userToBeUnBlocked = await User.findById(req.params.id);
        //2. Check if user found
        if (!userToBeUnBlocked){
            return next(appErr("User not found"));
        }
        //3. change the isBlocked property to false
        userToBeUnBlocked.isBlocked = false;
        //4. save
        userToBeUnBlocked.save();
        res.json({
            status:"success",
            data:"You have successfully unblocked this user",
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// Profile
const userProfileCtrl = async(req,res)=> {
    try{
        const user = await User.findById(req.userAuth);
        res.json({
            status:"success",
            data:user,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// update 
const updateUserCtrl = async(req,res,next)=> {
    const { email , lastName , firstName} = req.body;
    try{
        // Check if email is not taken
        if(email){
            const emailTaken = await User.findOne({email});
            if(emailTaken){
                return next(appErr("Email is taken",400));
            }
        }

        // update the user
        const user = await User.findByIdAndUpdate(
            req.userAuth,
            {
                lastName,
                firstName,
                email,
            },
            {
                new: true,
                runValidators: true,
            }
        );
        // send response
        res.json({
            status:"success",
            data:user,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// update Password
const updatePasswordCtrl = async(req,res,next)=> {
    const { password } = req.body;
    try{
        // Check if user is updating password
        if(password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password,salt);
            // update user
            await User.findByIdAndUpdate(
                req.userAuth,
                {password: hashedPassword},
                {new:true , runValidators:true},
            );
            res.json({
                status:"success",
                data:"Password Updated Successfully",
            });
        }else{
                next(appErr("Please enter password field"));
        }
    }catch(error){
        next(appErr(error.message));
    }
};

// delete account
const deleteUserAccountCtrl = async(req, res) => {
    try {
        //1. Find the user to be deleted
        const userToDelete = await User.findById(req.userAuth);
        //2. Find all the posts to be deleted
        await Post.deleteMany({user:req.userAuth});
        //3. Find all the comments to be deleted
        await Comment.deleteMany({user:req.userAuth});
        //4. Find all the categories to be deleted
        await Category.deleteMany({user:req.userAuth});
        //5. Finally delete the user itself
        // await userToDelete.delete();
        await User.deleteOne({ _id: userToDelete._id });
        // send response
        return res.json({
            status: "success",
            data: "Your account has been deleted Successfully",
        });
    } catch (error) {
        next(appErr(error.message));
    }
};

const profilePhotoUploadCtrl = async(req,res)=> {
    try{
    //1. Find the user to be updated
    const userToUpdate = await User.findById(req.userAuth);
    //2. Check if user is found
    if (!userToUpdate){
        return next(appErr("User not found",403));
    }
    //3. Check if user is blocked
    if (userToUpdate.isBlocked){
        return next(appErr("Action not allowed , your account is blocked",403));
    }
    //4. Check if user is updating their photo
    if (req.file){
        //5. Update profile photo
        await User.findByIdAndUpdate(req.userAuth,{
            $set:{
                profilePhoto:req.file.path,
            },
        },
        {
            new: true, // if you wanna see the update real time you have to do this
        }
        );
        res.json({
            status:"success",
            data:"Profile Photo Upload",
        });
    }
    }catch(error){
        next(appErr(error.message,500));
    }
};

module.exports = {
    userRegisterCtrl,
    userLoginCtrl,
    usersCtrl,
    userProfileCtrl,
    updateUserCtrl,
    updatePasswordCtrl,
    profilePhotoUploadCtrl,
    whoViewedMyProfile,
    followingCtrl,
    unFollowCtrl,
    blockUsersCtrl,
    unblockUserCtrl,
    adminBlockUserCtrl,
    adminUnBlockUserCtrl,
    deleteUserAccountCtrl,
};

