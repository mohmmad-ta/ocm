const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;

const getClientIp = (req) =>
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

const getRateLimitKey = (req) => ipKeyGenerator(getClientIp(req));

const createLimiter = ({
    windowMs,
    max,
    message,
    skipSuccessfulRequests = false,
}) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        keyGenerator: getRateLimitKey,
        message: {
            status: "fail",
            message,
        },
    });

exports.authLoginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: "تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى بعد 15 دقيقة.",
});

exports.authSignupLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 15,
    skipSuccessfulRequests: true,
    message: "تم تجاوز عدد محاولات إنشاء الحساب. حاول مرة أخرى بعد ساعة.",
});
