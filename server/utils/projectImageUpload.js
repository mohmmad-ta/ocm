const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('./appError');

const MAX_PROJECT_IMAGES = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const PUBLIC_IMAGE_PREFIX = '/public/images/projects/';
const PUBLIC_VIDEO_PREFIX = '/public/videos/projects/';
const imageDirectory = path.join(__dirname, '..', 'public', 'images', 'projects');
const videoDirectory = path.join(__dirname, '..', 'public', 'videos', 'projects');

fs.mkdirSync(imageDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });

const imageExtensions = {
    'image/avif': '.avif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};
const videoExtensions = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, file.fieldname === 'video' ? videoDirectory : imageDirectory);
    },
    filename: (req, file, callback) => {
        const extension = imageExtensions[file.mimetype] || videoExtensions[file.mimetype];
        callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
});

const uploader = multer({
    storage,
    limits: {
        fileSize: MAX_VIDEO_SIZE,
        files: MAX_PROJECT_IMAGES + 1,
        fields: 24,
        parts: 34,
    },
    fileFilter: (req, file, callback) => {
        const validImage = file.fieldname === 'images' && imageExtensions[file.mimetype];
        const validVideo = file.fieldname === 'video' && videoExtensions[file.mimetype];

        if (!validImage && !validVideo) {
            return callback(new AppError(
                'يسمح بصور JPG وPNG وWebP وAVIF، وفيديو MP4 وWebM وMOV فقط.',
                400,
                { code: 'INVALID_PROJECT_MEDIA_TYPE' }
            ));
        }
        callback(null, true);
    },
}).fields([
    { name: 'images', maxCount: MAX_PROJECT_IMAGES },
    { name: 'video', maxCount: 1 },
]);

const imageFiles = (files = {}) => files.images || [];
const videoFiles = (files = {}) => files.video || [];
const allFiles = (files = {}) => [...imageFiles(files), ...videoFiles(files)];

const removeProjectMedia = (mediaPath) => {
    if (typeof mediaPath !== 'string') return;

    let directory;
    if (mediaPath.startsWith(PUBLIC_IMAGE_PREFIX)) directory = imageDirectory;
    if (mediaPath.startsWith(PUBLIC_VIDEO_PREFIX)) directory = videoDirectory;
    if (!directory) return;

    const filePath = path.join(directory, path.basename(mediaPath));
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
        console.error(`Failed to remove project media ${path.basename(mediaPath)}:`, error.message);
    }
};

const removeUploadedFiles = (files = {}) => {
    allFiles(files).forEach((file) => {
        const prefix = file.fieldname === 'video' ? PUBLIC_VIDEO_PREFIX : PUBLIC_IMAGE_PREFIX;
        removeProjectMedia(`${prefix}${file.filename}`);
    });
};

const uploadProjectMedia = (req, res, next) => {
    uploader(req, res, (error) => {
        if (error) {
            removeUploadedFiles(req.files);
            if (error instanceof multer.MulterError) {
                const message = error.code === 'LIMIT_FILE_SIZE'
                    ? error.field === 'images'
                        ? 'حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.'
                        : 'حجم الفيديو يجب ألا يتجاوز 100 ميغابايت.'
                    : `يمكن رفع ${MAX_PROJECT_IMAGES} صور وفيديو واحد كحد أقصى.`;
                return next(new AppError(message, 400, { code: error.code }));
            }
            return next(error);
        }

        if (imageFiles(req.files).some((file) => file.size > MAX_IMAGE_SIZE)) {
            removeUploadedFiles(req.files);
            return next(new AppError('حجم كل صورة يجب ألا يتجاوز 5 ميغابايت.', 400, {
                code: 'LIMIT_IMAGE_SIZE',
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

const hasValidImageSignature = (file) => {
    const header = readHeader(file);
    if (file.mimetype === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (file.mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (file.mimetype === 'image/webp') return header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
    if (file.mimetype === 'image/avif') return header.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis', 'mif1'].includes(header.toString('ascii', 8, 12));
    return false;
};

const hasValidVideoSignature = (file) => {
    const header = readHeader(file);
    if (file.mimetype === 'video/webm') {
        return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    return header.toString('ascii', 4, 8) === 'ftyp';
};

const parseJsonField = (body, field, fallback) => {
    if (typeof body[field] !== 'string') return;
    try {
        body[field] = JSON.parse(body[field]);
    } catch {
        throw new AppError(`تعذر قراءة حقل ${field}.`, 400, {
            code: 'INVALID_MULTIPART_FIELD',
        });
    }
    if (body[field] === null || body[field] === undefined) body[field] = fallback;
};

const parseProjectMultipartFields = (req, res, next) => {
    try {
        if (imageFiles(req.files).some((file) => !hasValidImageSignature(file))) {
            throw new AppError('محتوى أحد الملفات لا يطابق صيغة صورة صالحة.', 400, {
                code: 'INVALID_PROJECT_IMAGE_CONTENT',
            });
        }
        if (videoFiles(req.files).some((file) => !hasValidVideoSignature(file))) {
            throw new AppError('محتوى ملف الفيديو غير صالح.', 400, {
                code: 'INVALID_PROJECT_VIDEO_CONTENT',
            });
        }

        parseJsonField(req.body, 'services', []);
        parseJsonField(req.body, 'existingImages', []);
        if (typeof req.body.active === 'string') req.body.active = req.body.active === 'true';
        if (typeof req.body.featured === 'string') req.body.featured = req.body.featured === 'true';
        if (typeof req.body.removeVideo === 'string') req.body.removeVideo = req.body.removeVideo === 'true';
        if (typeof req.body.year === 'string' && req.body.year.trim()) req.body.year = Number(req.body.year);
        next();
    } catch (error) {
        removeUploadedFiles(req.files);
        next(error);
    }
};

const uploadedImagePaths = (files = {}) => imageFiles(files).map(
    (file) => `${PUBLIC_IMAGE_PREFIX}${file.filename}`
);
const uploadedVideoPath = (files = {}) => {
    const file = videoFiles(files)[0];
    return file ? `${PUBLIC_VIDEO_PREFIX}${file.filename}` : null;
};

module.exports = {
    MAX_PROJECT_IMAGES,
    parseProjectMultipartFields,
    removeProjectMedia,
    removeUploadedFiles,
    uploadProjectMedia,
    uploadedImagePaths,
    uploadedVideoPath,
};
