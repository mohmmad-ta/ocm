const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../app');
const Project = require('../models/projectModel');
const Company = require('../models/companyModel');
const HeroVideo = require('../models/heroVideoModel');
const AppError = require('../utils/appError');
const errorHandler = require('../controllers/errorController');

const responseRecorder = () => {
    const result = { statusCode: null, body: null };
    return {
        result,
        response: {
            status(code) {
                result.statusCode = code;
                return this;
            },
            json(body) {
                result.body = body;
                return this;
            },
        },
    };
};

test('the application loads every configured route', () => {
    assert.ok(app?._router?.stack?.length > 0);
});

test('health endpoint reports the server is ready', () => {
    const healthLayer = app._router.stack.find((layer) => layer.route?.path === '/api/v1/health');
    assert.ok(healthLayer, 'health route is registered');

    const { result, response } = responseRecorder();
    healthLayer.route.stack[0].handle({}, response);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, { status: 'success', service: 'ocm-server' });
});

test('project schema validates portfolio fields and creates a slug', async () => {
    const companyId = new mongoose.Types.ObjectId();
    const project = new Project({
        name: 'A Different Energy',
        description: 'Campaign project',
        category: new mongoose.Types.ObjectId(),
        image: '/public/images/projects/example.jpg',
        images: ['/public/images/projects/example.jpg'],
        company: companyId,
        year: 2026,
        services: ['Photography'],
        video: '/public/videos/projects/campaign.mp4',
    });

    await project.validate();
    assert.equal(project.slug, 'a-different-energy');
    assert.equal(project.video, '/public/videos/projects/campaign.mp4');
    assert.equal(String(project.company), String(companyId));
});

test('company schema creates a slug and exposes the project relationship', async () => {
    const company = new Company({
        name: 'Form Studio',
        description: 'Creative partner',
        industry: 'Fashion',
    });

    await company.validate();
    assert.equal(company.slug, 'form-studio');
    assert.ok(Company.schema.virtuals.projects);
});

test('hero video schema validates playback settings', async () => {
    const heroVideo = new HeroVideo({
        name: 'Homepage hero',
        video: '/public/videos/hero/showreel.mp4',
        poster: '/public/images/hero/showreel.jpg',
        image: '/public/images/hero/hero-image.jpg',
    });

    await heroVideo.validate();
    assert.equal(heroVideo.active, true);
    assert.equal(heroVideo.autoplay, true);
    assert.equal(heroVideo.muted, true);
    assert.equal(heroVideo.loop, true);
    assert.equal(heroVideo.image, '/public/images/hero/hero-image.jpg');
});

test('API errors use structured JSON', () => {
    const { result, response } = responseRecorder();
    errorHandler(
        new AppError('missing', 404, { code: 'ENDPOINT_NOT_FOUND' }),
        { originalUrl: '/api/v1/missing' },
        response,
        () => {}
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body.status, 'fail');
    assert.equal(result.body.code, 'ENDPOINT_NOT_FOUND');
});
