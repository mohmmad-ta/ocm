require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;
const helmet = require('helmet');
const hpp = require('hpp');
const qs = require('qs');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const sanitizeRequest = require('./utils/sanitizeRequest');

const usersRouter = require('./routes/usersRouter');
const categoryRoutes = require('./routes/categoryRoutes');
const companyRoutes = require('./routes/companyRoutes');
const heroVideoRoutes = require('./routes/heroVideoRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const api = (process.env.API_URL || '/api/v1').replace(/\/+$/, '');

const parseTrustProxy = (value) => {
    if (value === undefined || value === null || value === '') {
        return process.env.NODE_ENV === 'production' ? 1 : false;
    }

    if (typeof value === 'number') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();

    if (['true', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['false', 'no', 'off'].includes(normalized)) {
        return false;
    }

    if (normalized === 'loopback' || normalized === 'linklocal' || normalized === 'uniquelocal') {
        return normalized;
    }

    const numericValue = Number(normalized);
    if (Number.isInteger(numericValue) && numericValue >= 0) {
        return numericValue;
    }

    return value;
};

const getClientIp = (req) =>
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

const getRateLimitKey = (req) => ipKeyGenerator(getClientIp(req));

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            mediaSrc: ["'self'", 'blob:', 'https:'],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'));
}

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 400,
    message: {
        status: 'fail',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'تم إرسال عدد كبير من الطلبات. يرجى المحاولة مرة أخرى بعد ساعة.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: getRateLimitKey,
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: false, limit: '15kb' }));

app.set('query parser', str => qs.parse(str, {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 50,
    depth: 8,
    parameterLimit: 100,
    plainObjects: true,
}));

app.use(sanitizeRequest);

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
        ]
    })
);

const configuredCorsOrigins = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedCorsOrigins = configuredCorsOrigins.length
    ? configuredCorsOrigins
    : process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = (req, callback) => {
    const origin = req.get('origin');
    const sameOrigin = `${req.protocol}://${req.get('host')}`;
    if (origin && origin !== sameOrigin && !allowedCorsOrigins.includes(origin)) {
        return callback(new AppError('هذا المصدر غير مسموح له بالوصول إلى الخادم.', 403, {
            code: 'CORS_ORIGIN_DENIED',
        }));
    }
    callback(null, {
        origin: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        optionsSuccessStatus: 204,
        maxAge: 86400,
    });
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(cookieParser());

const allowPublicAssetEmbedding = (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
};

app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));
app.use('/public', allowPublicAssetEmbedding, express.static(path.join(__dirname, 'public')));

app.get(`${api}/health`, (req, res) => {
    res.status(200).json({ status: 'success', service: 'ocm-server' });
});

app.use(`${api}/auth`, usersRouter);
app.use(`${api}/category`, categoryRoutes);
app.use(`${api}/company`, companyRoutes);
app.use(`${api}/hero-video`, heroVideoRoutes);
app.use(`${api}/project`, projectRoutes);

app.use(`${api}`, (req, res, next) => {
    next(new AppError('الخدمة المطلوبة غير موجودة. يرجى تحديث التطبيق أو المحاولة مرة أخرى لاحقاً.', 404, {
        code: 'ENDPOINT_NOT_FOUND',
    }));
});

// Serve the built Vue app, including refreshed dashboard and project URLs.
const clientDirectory = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDirectory));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/public/') || !req.accepts('html')) return next();
    res.sendFile(path.join(clientDirectory, 'index.html'), (error) => {
        if (error) next(error);
    });
});

app.use(globalErrorHandler);
module.exports = app;
