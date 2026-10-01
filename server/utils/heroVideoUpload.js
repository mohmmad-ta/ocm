const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('./appError');

const MAX_POSTER_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const VIDEO_PREFIX = '/public/videos/hero/';
const POSTER_PREFIX = '/public/images/hero/';
const videoDirectory = path.join(__dirname, '..', 'public', 'videos', 'hero');
const posterDirectory = path.join(__dirname, '..', 'public', 'images', 'hero');

fs.mkdirSync(videoDirectory, { recursive: true });
fs.mkdirSync(posterDirectory, { recursive: true });

const videoExtensions = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
};
const imageExtensions = {
    'image/avif': '.avif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, file.fieldname === 'video' ? videoDirectory : posterDirectory);
    },
    filename: (req, file, callback) => {
        const extension = videoExtensions[file.mimetype] || imageExtensions[file.mimetype];
        callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
});

const uploader = multer({
    storage,
    limits: { fileSize: MAX_VIDEO_SIZE, files: 3, fields: 14, parts: 18 },
    fileFilter: (req, file, callback) => {
        const validVideo = file.fieldname === 'video' && videoExtensions[file.mimetype];
        const validImage = ['poster', 'image'].includes(file.fieldname) && imageExtensions[file.mimetype];
        if (!validVideo && !validImage) {
            return callback(new AppError(
                'يسمح بفيديو MP4 وWebM وMOV، وصورة غلاف JPG وPNG وWebP وAVIF فقط.',
                400,
                { code: 'INVALID_HERO_MEDIA_TYPE' }
            ));
        }
        callback(null, true);
    },
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
    { name: 'image', maxCount: 1 },
]);

const videoFile = (files = {}) => files.video?.[0] || null;
const posterFile = (files = {}) => files.poster?.[0] || null;
const imageFile = (files = {}) => files.image?.[0] || null;

const removeHeroMedia = (mediaPath) => {
    if (typeof mediaPath !== 'string') return;
    const directory = mediaPath.startsWith(VIDEO_PREFIX)
        ? videoDirectory
        : mediaPath.startsWith(POSTER_PREFIX)
            ? posterDirectory
            : null;
    if (!directory) return;

    const filePath = path.join(directory, path.basename(mediaPath));
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
        console.error(`Failed to remove hero media ${path.basename(mediaPath)}:`, error.message);
    }
};

const removeUploadedHeroMedia = (files = {}) => {
    const video = videoFile(files);
    const poster = posterFile(files);
    const image = imageFile(files);
    if (video) removeHeroMedia(`${VIDEO_PREFIX}${video.filename}`);
    if (poster) removeHeroMedia(`${POSTER_PREFIX}${poster.filename}`);
    if (image) removeHeroMedia(`${POSTER_PREFIX}${image.filename}`);
};

const uploadHeroMedia = (req, res, next) => {
    uploader(req, res, (error) => {
        if (error) {
            removeUploadedHeroMedia(req.files);
            if (error instanceof multer.MulterError) {
                const message = error.code === 'LIMIT_FILE_SIZE'
                    ? ['poster', 'image'].includes(error.field)
                        ? 'حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.'
                        : 'حجم الفيديو يجب ألا يتجاوز 100 ميغابايت.'
                    : 'يمكن رفع فيديو واحد وصورة رئيسية واحدة وصورة غلاف واحدة فقط.';
                return next(new AppError(message, 400, { code: error.code }));
            }
            return next(error);
        }

        if ([posterFile(req.files), imageFile(req.files)].some((file) => file?.size > MAX_POSTER_SIZE)) {
            removeUploadedHeroMedia(req.files);
            return next(new AppError('حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.', 400, {
                code: 'LIMIT_HERO_IMAGE_SIZE',
            }));
        }
        next();
    });
};

const readHeader = (file) => {
    const descriptor = fs.openSync(file.path, 'r');
    const header = Buffer.alloc(16);
    try {
        fs.readSync(descriptor, header, 0, header.length, 0);
    } finally {
        fs.closeSync(descriptor);
    }
    return header;
};

const validVideoContent = (file) => {
    const header = readHeader(file);
    if (file.mimetype === 'video/webm') {
        return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    return header.toString('ascii', 4, 8) === 'ftyp';
};

const validPosterContent = (file) => {
    const header = readHeader(file);
    if (file.mimetype === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (file.mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (file.mimetype === 'image/webp') return header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
    if (file.mimetype === 'image/avif') return header.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis', 'mif1'].includes(header.toString('ascii', 8, 12));
    return false;
};

const parseBoolean = (body, field) => {
    if (typeof body[field] === 'string') body[field] = body[field] === 'true';
};

const parseHeroMultipartFields = (req, res, next) => {
    try {
        const video = videoFile(req.files);
        const poster = posterFile(req.files);
        const image = imageFile(req.files);
        if (video && !validVideoContent(video)) {
            throw new AppError('محتوى ملف الفيديو غير صالح.', 400, {
                code: 'INVALID_HERO_VIDEO_CONTENT',
            });
        }
        if (poster && !validPosterContent(poster)) {
            throw new AppError('محتوى صورة الغلاف غير صالح.', 400, {
                code: 'INVALID_HERO_POSTER_CONTENT',
            });
        }
        if (image && !validPosterContent(image)) {
            throw new AppError('محتوى صورة الواجهة غير صالح.', 400, {
                code: 'INVALID_HERO_IMAGE_CONTENT',
            });
        }

        ['active', 'autoplay', 'muted', 'loop', 'removePoster', 'removeImage'].forEach(
            (field) => parseBoolean(req.body, field)
        );
        next();
    } catch (error) {
        removeUploadedHeroMedia(req.files);
        next(error);
    }
};

const uploadedHeroVideoPath = (files = {}) => {
    const file = videoFile(files);
    return file ? `${VIDEO_PREFIX}${file.filename}` : null;
};
const uploadedHeroPosterPath = (files = {}) => {
    const file = posterFile(files);
    return file ? `${POSTER_PREFIX}${file.filename}` : null;
};
const uploadedHeroImagePath = (files = {}) => {
    const file = imageFile(files);
    return file ? `${POSTER_PREFIX}${file.filename}` : null;
};

module.exports = {
    parseHeroMultipartFields,
    removeHeroMedia,
    removeUploadedHeroMedia,
    uploadHeroMedia,
    uploadedHeroImagePath,
    uploadedHeroPosterPath,
    uploadedHeroVideoPath,
};
