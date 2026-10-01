const Category = require('./../models/categoryModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Project = require('../models/projectModel');


exports.getAllCategory = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.updateCategory = factory.updateOne(Category);
exports.deleteCategory = catchAsync(async (req, res, next) => {
    if (await Project.exists({ category: req.params.id }).setOptions({ includeInactive: true })) {
        return next(new AppError('انقل مشاريع هذا التصنيف إلى تصنيف آخر قبل حذفه.', 409, {
            code: 'CATEGORY_HAS_PROJECTS',
        }));
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(new AppError('التصنيف المطلوب غير موجود.', 404));
    res.status(204).send();
});
