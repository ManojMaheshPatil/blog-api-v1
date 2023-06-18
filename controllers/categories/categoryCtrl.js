const Category = require("../../model/Category/Category");
const appErr = require("../../utils/appErr");

// create
const createCategoryCtrl = async(req,res,next)=> {
    const { title } = req.body;
    try{
        const category = await Category.create({title,user:req.userAuth});
        res.json({
            status:"success",
            data:category,
        });
    }catch(error){
        next(appErr(error.message));
    }
};

// all
const fetchCategoriesCtrl = async(req,res)=> {
    try{
        const categories = await Category.find();
        res.json({
            status:"success",
            data: categories,
        });
    }catch(error){
        res.json(error.message);
    }
};


// single
const getCategoryCtrl = async(req,res)=> {
    try{
        const category = await Category.findById(req.params.id);
        res.json({
            status:"success",
            data:category,
        });
    }catch(error){
        res.json(error.message);
    }
};

const deleteCategoryCtrl = async(req,res)=> {
    try{
        await Category.findByIdAndDelete(req.params.id);
        res.json({
            status:"success",
            data:"Deleted Successfully",
        });
    }catch(error){
        res.json(error.message);
    }
};

const updateCategoryCtrl = async(req,res)=> {
    const { title } = req.body;
    try{
        const category = await Category.findByIdAndUpdate(req.params.id , {title} , {new:true, runValidators:true});
        res.json({
            status:category,
            data:"update categories route ",
        });
    }catch(error){
        res.json(error.message);
    }
};

module.exports = {
    createCategoryCtrl,
    getCategoryCtrl,
    deleteCategoryCtrl,
    updateCategoryCtrl,
    fetchCategoriesCtrl,
}