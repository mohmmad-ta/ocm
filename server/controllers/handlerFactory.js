const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const { assertSafeObject } = require('./../utils/sanitizeRequest');
const fs = require("fs");
const path = require("path");

exports.deleteOne = (Model, queryOptions = {}) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id).setOptions(queryOptions);
      if (doc?.image && doc.image.includes('/public/')) {
          const imageRelativePath = doc.image.split("/public/")[1];
          const imagePath = path.join(__dirname, "..", "public", imageRelativePath);

          if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
          }
      }

    if (!doc) {
      return next(new AppError('العنصر المطلوب غير موجود أو تم حذفه.', 404, {
          code: 'RESOURCE_NOT_FOUND',
      }));
    }
    res.status(204).json({status: 'success', data: null});
  });

exports.updateOne = (Model, queryOptions = {}) =>
    catchAsync(async (req, res, next) => {
        assertSafeObject(req.body, 'body');
        let updateData = { ...req.body };

        // If a single file was uploaded
        if (req.file) {
            updateData.file = req.file.filename; // or req.file.path depending on your schema
        }

        // If multiple files were uploaded
        if (req.files) {
            Object.keys(req.files).forEach(field => {
                updateData[field] = req.files[field][0].filename;
            });
        }

        const doc = await Model.findByIdAndUpdate(req.params.id, updateData, {
            returnDocument: 'after',
            runValidators: true,
        }).setOptions(queryOptions);

        if (!doc) {
            return next(new AppError('العنصر المطلوب غير موجود أو تم حذفه.', 404, {
                code: 'RESOURCE_NOT_FOUND',
            }));
        }

        res.status(200).json({
            status: 'success',
            data: doc
        });
    });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    assertSafeObject(req.body, 'body');
    const doc = await Model.create(req.body);

    res.status(201).json({status: 'success', data: doc});
  });

exports.getOne = (Model, queryOptions = {}) =>
  catchAsync(async (req, res, next) => {
    const query = await Model.findById(req.params.id).setOptions(queryOptions)

    if (!query) {
      return next(new AppError('العنصر المطلوب غير موجود أو تم حذفه.', 404, {
          code: 'RESOURCE_NOT_FOUND',
      }));
    }

    res.status(200).json({status: 'success', data: query});
  });

exports.getAll = (Model, queryOptions = {}) =>
  catchAsync(async (req, res, next) => {

    const filter = {};

    const features = new APIFeatures(Model.find(filter).setOptions(queryOptions), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    res.status(200).json({status: 'success', results: doc.length, data: doc});
  });
