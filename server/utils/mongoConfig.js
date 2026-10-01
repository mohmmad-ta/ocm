const requiredPair = (first, second, firstName, secondName) => {
    if (Boolean(first) !== Boolean(second)) {
        const error = new Error(`${firstName} and ${secondName} must be configured together.`);
        error.code = 'INVALID_MONGO_CONFIG';
        throw error;
    }
};

const positiveInteger = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const getMongoConnectionConfig = () => {
    const uri = String(process.env.MONGOOSE_URL || '').trim();
    const user = String(process.env.MONGOOSE_USER || '').trim();
    const password = String(process.env.MONGOOSE_PASSWORD || '');

    if (!uri) {
        const error = new Error('MONGOOSE_URL is required.');
        error.code = 'INVALID_MONGO_CONFIG';
        throw error;
    }

    requiredPair(user, password, 'MONGOOSE_USER', 'MONGOOSE_PASSWORD');

    const options = {};
    const dbName = String(process.env.MONGOOSE_DB_NAME || '').trim();
    const authSource = String(process.env.MONGOOSE_AUTH_SOURCE || '').trim();
    const serverSelectionTimeoutMS = positiveInteger(process.env.MONGOOSE_SERVER_SELECTION_TIMEOUT_MS);

    if (user) {
        options.user = user;
        options.pass = password;
    }
    if (dbName) options.dbName = dbName;
    if (authSource) options.authSource = authSource;
    if (serverSelectionTimeoutMS) options.serverSelectionTimeoutMS = serverSelectionTimeoutMS;

    return { uri, options };
};

const mongoStartupMessage = (error) => {
    if (error?.code === 13 || error?.codeName === 'Unauthorized') {
        return [
            'MongoDB authentication failed.',
            'Set credentials in MONGOOSE_URL or use MONGOOSE_USER and MONGOOSE_PASSWORD.',
            'Set MONGOOSE_AUTH_SOURCE to the database where the MongoDB user was created (commonly admin).',
        ].join(' ');
    }

    if (error?.code === 'INVALID_MONGO_CONFIG') return error.message;
    return error?.message || 'Unknown MongoDB connection error.';
};

module.exports = { getMongoConnectionConfig, mongoStartupMessage };
