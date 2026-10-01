const mongoose = require('mongoose');
const Company = require('../models/companyModel');
const Project = require('../models/projectModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { assertSafeObject } = require('../utils/sanitizeRequest');

const companyPayload = (body) => {
    const fields = ['name', 'description', 'industry', 'website', 'logo', 'image', 'active'];
    return Object.fromEntries(
        fields
            .filter((field) => body[field] !== undefined)
            .map((field) => [field, body[field]])
    );
};

const projectSelection = 'name slug description category company image images video year services featured';

exports.getAllCompanies = catchAsync(async (req, res) => {
    const features = new APIFeatures(Company.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const companies = await features.query.populate({
        path: 'projects',
        select: projectSelection,
    });

    res.status(200).json({
        status: 'success',
        results: companies.length,
        data: companies,
    });
});

exports.getCompany = catchAsync(async (req, res, next) => {
    const { identifier } = req.params;
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : { slug: identifier };
    const company = await Company.findOne(query).populate({
        path: 'projects',
        select: projectSelection,
    });

    if (!company) {
        return next(new AppError('الشركة المطلوبة غير موجودة.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    res.status(200).json({ status: 'success', data: company });
});

exports.adminGetAllCompanies = catchAsync(async (req, res) => {
    const features = new APIFeatures(Company.find().setOptions({ includeInactive: true }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const companies = await features.query.populate({
        path: 'projects',
        select: projectSelection,
        options: { includeInactive: true },
    });

    res.status(200).json({ status: 'success', results: companies.length, data: companies });
});

exports.adminGetCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findById(req.params.id)
        .setOptions({ includeInactive: true })
        .populate({
            path: 'projects',
            select: projectSelection,
            options: { includeInactive: true },
        });

    if (!company) {
        return next(new AppError('الشركة المطلوبة غير موجودة.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    res.status(200).json({ status: 'success', data: company });
});

exports.adminCreateCompany = catchAsync(async (req, res) => {
    assertSafeObject(req.body, 'body');
    const company = await Company.create(companyPayload(req.body));
    res.status(201).json({ status: 'success', data: company });
});

exports.adminUpdateCompany = catchAsync(async (req, res, next) => {
    assertSafeObject(req.body, 'body');
    const company = await Company.findByIdAndUpdate(
        req.params.id,
        { $set: companyPayload(req.body) },
        { returnDocument: 'after', runValidators: true }
    ).setOptions({ includeInactive: true });

    if (!company) {
        return next(new AppError('الشركة المطلوبة غير موجودة.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    res.status(200).json({ status: 'success', data: company });
});

exports.adminDeleteCompany = catchAsync(async (req, res, next) => {
    const relatedProject = await Project.findOne({ company: req.params.id })
        .setOptions({ includeInactive: true })
        .select('_id');

    if (relatedProject) {
        return next(new AppError('لا يمكن حذف الشركة قبل نقل أو حذف المشاريع المرتبطة بها.', 409, {
            code: 'COMPANY_HAS_PROJECTS',
        }));
    }

    const company = await Company.findByIdAndDelete(req.params.id)
        .setOptions({ includeInactive: true });
    if (!company) {
        return next(new AppError('الشركة المطلوبة غير موجودة.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    res.status(204).send();
});
