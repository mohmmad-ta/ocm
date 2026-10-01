const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Admin = require('../../models/auth/adminModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

const positiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const ADMIN_JWT_EXPIRES_IN_DAYS = positiveInteger(process.env.ADMIN_JWT_EXPIRES_IN_DAYS, 1);
const ADMIN_JWT_EXPIRES_IN = `${ADMIN_JWT_EXPIRES_IN_DAYS}d`;
const ADMIN_JWT_COOKIE_EXPIRES_IN_DAYS = positiveInteger(
    process.env.ADMIN_JWT_COOKIE_EXPIRES_IN,
    ADMIN_JWT_EXPIRES_IN_DAYS
);

const booleanEnv = (value, fallback = false) => {
    if (typeof value !== 'string') return fallback;
    if (['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase())) return true;
    if (['false', '0', 'no', 'off'].includes(value.trim().toLowerCase())) return false;
    return fallback;
};

const tokenFromRequest = (req) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.slice(7).trim() || null;
    }
    return req.cookies?.jwt || null;
};

const cookieOptions = () => {
    const secure = booleanEnv(process.env.JWT_COOKIE_SECURE, process.env.NODE_ENV === 'production');
    const options = {
        expires: new Date(Date.now() + ADMIN_JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: process.env.JWT_COOKIE_SAMESITE || (secure ? 'none' : 'lax'),
        secure,
        path: process.env.JWT_COOKIE_PATH || '/',
    };

    if (process.env.JWT_COOKIE_DOMAIN) options.domain = process.env.JWT_COOKIE_DOMAIN;
    return options;
};

const signToken = (id) => jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES_IN }
);

const findAdminFromToken = async (req, next) => {
    const token = tokenFromRequest(req);
    if (!token) {
        next(new AppError('أنت غير مسجل الدخول! يرجى تسجيل الدخول للوصول.', 401));
        return null;
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
        next(new AppError('المستخدم المرتبط بهذا التوكن لم يعد موجودًا.', 401));
        return null;
    }

    if (admin.changedPasswordAfter(decoded.iat)) {
        next(new AppError('تم تغيير كلمة المرور بعد إصدار هذه الجلسة. يرجى تسجيل الدخول مرة أخرى.', 401));
        return null;
    }

    return admin;
};

exports.loginAdmin = catchAsync(async (req, res, next) => {
    const { userID, password } = req.body;
    if (!userID || !password) {
        return next(new AppError('يرجى إدخال اسم المستخدم وكلمة المرور!', 400));
    }

    const admin = await Admin.findOne({ userID }).select('+password');
    if (!admin || !(await admin.correctPassword(password, admin.password))) {
        return next(new AppError('اسم المستخدم أو كلمة المرور غير صحيحة!', 401));
    }

    const token = signToken(admin._id);
    res.cookie('jwt', token, cookieOptions());
    admin.password = undefined;

    res.status(200).json({ status: 'success', data: { user: admin } });
});

exports.protect = () => catchAsync(async (req, res, next) => {
    const admin = await findAdminFromToken(req, next);
    if (!admin) return;

    req.user = admin;
    res.locals.user = admin;
    next();
});

exports.checkToken = catchAsync(async (req, res, next) => {
    const admin = await findAdminFromToken(req, next);
    if (!admin) return;

    res.status(200).json({
        status: 'success',
        valid: true,
        data: { user: admin },
    });
});

exports.logout = (req, res) => {
    const options = { ...cookieOptions(), expires: new Date(0) };
    res.clearCookie('jwt', options);
    res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(new AppError('ليس لديك الصلاحية لتنفيذ هذا الإجراء', 403));
    }
    next();
};
