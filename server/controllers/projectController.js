const mongoose = require('mongoose');
const Project = require('../models/projectModel');
const Category = require('../models/categoryModel');
const Company = require('../models/companyModel');
const factory = require('./handlerFactory');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { assertSafeObject } = require('../utils/sanitizeRequest');
const {
    MAX_PROJECT_IMAGES,
    removeProjectMedia,
    removeUploadedFiles,
    uploadedImagePaths,
    uploadedVideoPath,
} = require('../utils/projectImageUpload');

exports.getAllProjects = factory.getAll(Project);

exports.getProject = catchAsync(async (req, res, next) => {
    const { identifier } = req.params;
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : { slug: identifier };
    const project = await Project.findOne(query);

    if (!project) {
        return next(new AppError('المشروع المطلوب غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    res.status(200).json({ status: 'success', data: project });
});

exports.adminGetProject = factory.getOne(Project, { includeInactive: true });

const projectPayload = (body) => {
    const fields = ['name', 'description', 'company', 'year', 'services', 'category', 'featured', 'active'];
    return Object.fromEntries(
        fields
            .filter((field) => body[field] !== undefined)
            .map((field) => [field, body[field]])
    );
};

const storedProjectImages = (project) => {
    if (Array.isArray(project.images) && project.images.length) return project.images;
    return project.image ? [project.image] : [];
};

const ensureCategoryExists = async (categoryId) => {
    if (!categoryId || !mongoose.isValidObjectId(categoryId) || !(await Category.exists({ _id: categoryId }))) {
        throw new AppError('التصنيف المحدد غير موجود.', 400, {
            code: 'INVALID_PROJECT_CATEGORY',
        });
    }
};

const ensureCompanyExists = async (companyId) => {
    if (!companyId || !mongoose.isValidObjectId(companyId) || !(await Company.exists({ _id: companyId }))) {
        throw new AppError('الشركة المحددة غير موجودة.', 400, {
            code: 'INVALID_PROJECT_COMPANY',
        });
    }
};

exports.adminCreateProject = catchAsync(async (req, res, next) => {
    try {
        assertSafeObject(req.body, 'body');
        const images = uploadedImagePaths(req.files);
        if (!images.length) {
            throw new AppError('يرجى رفع صورة واحدة على الأقل للمشروع.', 400, {
                code: 'PROJECT_IMAGE_REQUIRED',
            });
        }
        await Promise.all([
            ensureCategoryExists(req.body.category),
            ensureCompanyExists(req.body.company),
        ]);
        const video = uploadedVideoPath(req.files);
        const project = await Project.create({
            ...projectPayload(req.body),
            image: images[0],
            images,
            video,
        });
        res.status(201).json({ status: 'success', data: project });
    } catch (error) {
        removeUploadedFiles(req.files);
        throw error;
    }
});

exports.adminUpdateProject = catchAsync(async (req, res, next) => {
    let project;
    try {
        assertSafeObject(req.body, 'body');
        project = await Project.findById(req.params.id).setOptions({ includeInactive: true });
    } catch (error) {
        removeUploadedFiles(req.files);
        throw error;
    }

    if (!project) {
        removeUploadedFiles(req.files);
        return next(new AppError('المشروع المطلوب غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    try {
        await Promise.all([
            ensureCategoryExists(req.body.category || project.category?._id || project.category),
            ensureCompanyExists(req.body.company || project.company?._id || project.company),
        ]);
    } catch (error) {
        removeUploadedFiles(req.files);
        throw error;
    }

    const previousImages = storedProjectImages(project);
    const requestedImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : previousImages;
    const retainedImages = requestedImages.filter((image) => previousImages.includes(image));

    if (retainedImages.length !== requestedImages.length) {
        removeUploadedFiles(req.files);
        return next(new AppError('تحتوي قائمة الصور على مسار غير صالح.', 400, {
            code: 'INVALID_PROJECT_IMAGE_PATH',
        }));
    }

    const images = [...new Set([...retainedImages, ...uploadedImagePaths(req.files)])];
    if (!images.length || images.length > MAX_PROJECT_IMAGES) {
        removeUploadedFiles(req.files);
        return next(new AppError(
            images.length ? `يمكن حفظ ${MAX_PROJECT_IMAGES} صور كحد أقصى.` : 'يجب الاحتفاظ بصورة واحدة على الأقل للمشروع.',
            400,
            { code: images.length ? 'TOO_MANY_PROJECT_IMAGES' : 'PROJECT_IMAGE_REQUIRED' }
        ));
    }

    const previousVideo = project.video;
    const newVideo = uploadedVideoPath(req.files);
    const shouldRemoveVideo = req.body.removeVideo === true;
    const video = newVideo || (shouldRemoveVideo ? null : previousVideo);

    try {
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    ...projectPayload(req.body),
                    image: images[0],
                    images,
                    video,
                },
            },
            { returnDocument: 'after', runValidators: true }
        ).setOptions({ includeInactive: true });

        previousImages.filter((image) => !images.includes(image)).forEach(removeProjectMedia);
        if (previousVideo && previousVideo !== video) removeProjectMedia(previousVideo);
        res.status(200).json({ status: 'success', data: updatedProject });
    } catch (error) {
        removeUploadedFiles(req.files);
        throw error;
    }
});

exports.adminDeleteProject = catchAsync(async (req, res, next) => {
    const project = await Project.findByIdAndDelete(req.params.id).setOptions({ includeInactive: true });
    if (!project) {
        return next(new AppError('المشروع المطلوب غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    storedProjectImages(project).forEach(removeProjectMedia);
    if (project.video) removeProjectMedia(project.video);
    res.status(204).send();
});

exports.adminGetAllProjects = catchAsync(async (req, res) => {
    const features = new APIFeatures(Project.find().setOptions({ includeInactive: true }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const projects = await features.query;

    res.status(200).json({
        status: 'success',
        results: projects.length,
        data: projects,
    });
});
