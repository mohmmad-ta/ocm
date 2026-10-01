const HeroVideo = require('../models/heroVideoModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { assertSafeObject } = require('../utils/sanitizeRequest');
const {
    removeHeroMedia,
    removeUploadedHeroMedia,
    uploadedHeroImagePath,
    uploadedHeroPosterPath,
    uploadedHeroVideoPath,
} = require('../utils/heroVideoUpload');

const heroPayload = (body) => {
    const fields = ['name', 'active', 'autoplay', 'muted', 'loop'];
    return Object.fromEntries(
        fields
            .filter((field) => body[field] !== undefined)
            .map((field) => [field, body[field]])
    );
};

const deactivateOtherVideos = (id) => HeroVideo.updateMany(
    { _id: { $ne: id }, active: true },
    { $set: { active: false } }
);

exports.getActiveHeroVideo = catchAsync(async (req, res, next) => {
    const heroVideo = await HeroVideo.findOne({ active: true }).sort('-updatedAt');
    if (!heroVideo) {
        return next(new AppError('لا يوجد فيديو واجهة نشط حاليًا.', 404, {
            code: 'ACTIVE_HERO_VIDEO_NOT_FOUND',
        }));
    }

    res.status(200).json({ status: 'success', data: heroVideo });
});

exports.adminGetAllHeroVideos = catchAsync(async (req, res) => {
    const heroVideos = await HeroVideo.find().sort('-updatedAt');
    res.status(200).json({ status: 'success', results: heroVideos.length, data: heroVideos });
});

exports.adminGetHeroVideo = catchAsync(async (req, res, next) => {
    const heroVideo = await HeroVideo.findById(req.params.id);
    if (!heroVideo) {
        return next(new AppError('فيديو الواجهة غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }
    res.status(200).json({ status: 'success', data: heroVideo });
});

exports.adminCreateHeroVideo = catchAsync(async (req, res, next) => {
    assertSafeObject(req.body, 'body');
    const video = uploadedHeroVideoPath(req.files);
    const poster = uploadedHeroPosterPath(req.files);
    const image = uploadedHeroImagePath(req.files);

    if (!video) {
        removeUploadedHeroMedia(req.files);
        return next(new AppError('يرجى رفع فيديو الواجهة.', 400, {
            code: 'HERO_VIDEO_REQUIRED',
        }));
    }

    let heroVideo;
    try {
        heroVideo = await HeroVideo.create({
            ...heroPayload(req.body),
            video,
            poster,
            image,
        });
        if (heroVideo.active) await deactivateOtherVideos(heroVideo._id);
        res.status(201).json({ status: 'success', data: heroVideo });
    } catch (error) {
        if (heroVideo?._id) {
            await HeroVideo.findByIdAndDelete(heroVideo._id).catch(() => {});
        }
        removeUploadedHeroMedia(req.files);
        throw error;
    }
});

exports.adminUpdateHeroVideo = catchAsync(async (req, res, next) => {
    assertSafeObject(req.body, 'body');
    const heroVideo = await HeroVideo.findById(req.params.id);
    if (!heroVideo) {
        removeUploadedHeroMedia(req.files);
        return next(new AppError('فيديو الواجهة غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    const previousVideo = heroVideo.video;
    const previousPoster = heroVideo.poster;
    const previousImage = heroVideo.image;
    const newVideo = uploadedHeroVideoPath(req.files);
    const newPoster = uploadedHeroPosterPath(req.files);
    const newImage = uploadedHeroImagePath(req.files);
    const video = newVideo || previousVideo;
    const poster = newPoster || (req.body.removePoster === true ? null : previousPoster);
    const image = newImage || (req.body.removeImage === true ? null : previousImage);

    let updateSaved = false;
    try {
        const updatedHeroVideo = await HeroVideo.findByIdAndUpdate(
            req.params.id,
            { $set: { ...heroPayload(req.body), video, poster, image } },
            { returnDocument: 'after', runValidators: true }
        );
        updateSaved = true;

        if (updatedHeroVideo.active) await deactivateOtherVideos(updatedHeroVideo._id);
        if (newVideo && previousVideo !== video) removeHeroMedia(previousVideo);
        if (previousPoster && previousPoster !== poster) removeHeroMedia(previousPoster);
        if (previousImage && previousImage !== image) removeHeroMedia(previousImage);
        res.status(200).json({ status: 'success', data: updatedHeroVideo });
    } catch (error) {
        if (!updateSaved) removeUploadedHeroMedia(req.files);
        throw error;
    }
});

exports.adminDeleteHeroVideo = catchAsync(async (req, res, next) => {
    const heroVideo = await HeroVideo.findByIdAndDelete(req.params.id);
    if (!heroVideo) {
        return next(new AppError('فيديو الواجهة غير موجود.', 404, {
            code: 'RESOURCE_NOT_FOUND',
        }));
    }

    removeHeroMedia(heroVideo.video);
    removeHeroMedia(heroVideo.poster);
    removeHeroMedia(heroVideo.image);
    res.status(204).send();
});
