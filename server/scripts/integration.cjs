// Uses a unique disposable database; never seeds or drops the configured app database.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.JWT_COOKIE_SECURE = 'false';
process.env.JWT_COOKIE_SAMESITE = 'lax';
process.env.JWT_COOKIE_DOMAIN = '';
process.env.JWT_COOKIE_PATH = '/';
process.env.TRUST_PROXY = 'false';
process.env.API_URL = '/api/v1';
const mongoose = require('mongoose');
const { getMongoConnectionConfig } = require('../utils/mongoConfig');
const app = require('../app');
const Admin = require('../models/auth/adminModel');
const Project = require('../models/projectModel');
const HeroVideo = require('../models/heroVideoModel');
const { removeProjectMedia } = require('../utils/projectImageUpload');
const { removeHeroMedia } = require('../utils/heroVideoUpload');
const database = `ocm_dashboard_test_${crypto.randomBytes(8).toString('hex')}`;
const preview = process.argv.includes('--preview');
const password = crypto.randomBytes(16).toString('hex');
let server, base, cookie = '', connected = false, checks = 0;
const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv1sAAAAASUVORK5CYII=', 'base64');
const videoBytes = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
function form(fields, files = {}) {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    for (const [key, type] of Object.entries(files)) body.append(key, new Blob([type === 'video' ? videoBytes : imageBytes], { type: type === 'video' ? 'video/mp4' : 'image/png' }), type === 'video' ? 'fixture.mp4' : 'fixture.png');
    return body;
}
async function request(url, { method = 'GET', body, auth = true, status = 200, origin } = {}) {
    const headers = {};
    if (auth && cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(`${base}/api/v1${url}`, { method, body, headers });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, `${method} ${url}: ${JSON.stringify(data)}`);
    checks++;
    return { response, data: data?.data, payload: data };
}
async function cleanup() {
    if (server) await new Promise(resolve => server.close(resolve));
    if (connected) {
        const projects = await Project.find().setOptions({ includeInactive: true });
        projects.forEach(p => { p.images.forEach(removeProjectMedia); removeProjectMedia(p.video); });
        const heroes = await HeroVideo.find();
        heroes.forEach(h => [h.video, h.image, h.poster].forEach(removeHeroMedia));
        assert.equal(mongoose.connection.name, database);
        await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
}
async function run() {
    const { uri, options } = getMongoConnectionConfig();
    await mongoose.connect(uri, { ...options, dbName: database, serverSelectionTimeoutMS: 10000 });
    connected = true;
    await Admin.create({ userID: 'dashboard-test', password, passwordConfirm: password });
    server = await new Promise(resolve => { const http = app.listen(preview ? 7051 : 0, '127.0.0.1', () => resolve(http)); });
    base = `http://127.0.0.1:${server.address().port}`;
    await request('/auth/admin/project', { auth: false, status: 401 });
    await request('/auth/admin/login', { method: 'POST', body: { userID: 'dashboard-test', password: 'wrong' }, status: 401 });
    const login = await request('/auth/admin/login', { method: 'POST', body: { userID: 'dashboard-test', password }, origin: base });
    cookie = login.response.headers.get('set-cookie').split(';')[0];
    assert.match(login.response.headers.get('set-cookie'), /HttpOnly/i);
    assert.equal(login.data.user.password, undefined);
    await request('/auth/checkToken');
    await request('/category', { method: 'POST', body: { name: 'Unauthorized' }, auth: false, status: 401 });
    const category = (await request('/category', { method: 'POST', body: { name: 'Campaigns' }, status: 201 })).data;
    const company = (await request('/auth/admin/company', { method: 'POST', body: { name: 'Studio Partner', description: 'Integration test company', industry: 'Media' }, status: 201 })).data;
    const fields = { name: 'Connected Campaign', company: company._id, category: category._id, services: ['Film', 'Photography'], year: 2026, active: true };
    const project = (await request('/auth/admin/project', { method: 'POST', body: form(fields, { images: 'image', video: 'video' }), status: 201 })).data;
    assert.ok(project.image && project.video);
    const publicProject = (await request(`/project/${project.slug}`, { auth: false })).data;
    assert.equal(publicProject.company.name, company.name);
    assert.equal(publicProject.category.name, category.name);
    const publicCompany = (await request(`/company/${company.slug}`, { auth: false })).data;
    assert.equal(publicCompany.projects[0]._id, project._id);
    const media = await fetch(`${base}${project.video}`, { headers: { Range: 'bytes=0-7' } });
    assert.equal(media.status, 206);
    await request(`/category/${category._id}`, { method: 'DELETE', status: 409 });
    await request(`/auth/admin/company/${company._id}`, { method: 'DELETE', status: 409 });
    const updated = (await request(`/auth/admin/project/${project._id}`, { method: 'PATCH', body: form({ ...fields, name: 'Updated Campaign', existingImages: project.images, active: false, removeVideo: true }) })).data;
    assert.equal(updated.active, false);
    assert.equal(updated.video, null);
    assert.equal(fs.existsSync(path.join(__dirname, '..', project.video)), false);
    await request(`/project/${project._id}`, { auth: false, status: 404 });
    assert.equal((await request('/auth/admin/project')).data.length, 1);
    await request(`/auth/admin/project/${project._id}`, { method: 'PATCH', body: form({ active: true, existingImages: project.images }) });
    const beforeFiles = fs.readdirSync(path.join(__dirname, '../public/videos/projects')).length;
    await request('/auth/admin/project', { method: 'POST', body: form(fields, { video: 'video' }), status: 400 });
    assert.equal(fs.readdirSync(path.join(__dirname, '../public/videos/projects')).length, beforeFiles);
    await request('/auth/admin/project', { method: 'POST', body: form({ ...fields, company: new mongoose.Types.ObjectId().toString() }, { images: 'image' }), status: 400 });
    const hero = (await request('/auth/admin/hero-video', { method: 'POST', body: form({ name: 'Homepage hero', active: true }, { video: 'video', poster: 'image', image: 'image' }), status: 201 })).data;
    assert.equal((await request('/hero-video', { auth: false })).data.image, hero.image);
    await request(`/auth/admin/hero-video/${hero._id}`, { method: 'PATCH', body: form({ active: false, removeImage: true }) });
    await request('/hero-video', { auth: false, status: 404 });
    for (const url of ['/admin/projects', `/projects/${project.slug}`]) {
        const result = await fetch(`${base}${url}`, { headers: { Accept: 'text/html' } });
        assert.equal(result.status, 200);
        assert.match(await result.text(), /id="app"/);
    }
    if (preview) {
        console.log(`Temporary preview: ${base}/admin/login?lang=en`);
        console.log(`Disposable credentials: dashboard-test / ${password}`);
        console.log(`${checks} API checks passed. Press Ctrl+C to remove the temporary database and media.`);
        let stopping = false;
        const stopPreview = () => {
            if (stopping) return;
            stopping = true;
            cleanup().then(() => process.exit(0)).catch(() => process.exit(1));
        };
        process.once('SIGINT', stopPreview);
        process.once('SIGTERM', stopPreview);
        process.once('SIGHUP', stopPreview);
        return;
    }
    await request(`/auth/admin/hero-video/${hero._id}`, { method: 'DELETE', status: 204 });
    await request(`/auth/admin/project/${project._id}`, { method: 'DELETE', status: 204 });
    await request(`/auth/admin/company/${company._id}`, { method: 'DELETE', status: 204 });
    await request(`/category/${category._id}`, { method: 'DELETE', status: 204 });
    const logout = await request('/auth/logout', { method: 'POST', origin: base });
    assert.match(logout.response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    cookie = '';
    await request('/auth/checkToken', { status: 401 });
    console.log(`Passed ${checks} API checks plus cookie, relationship, upload, cleanup, video range, and SPA route assertions.`);
    await cleanup();
}
run().catch(async error => {
    console.error(error.name, error.code || '', error instanceof assert.AssertionError ? error.message : 'Integration setup or request failed. Check MongoDB access and local port permissions.');
    await cleanup().catch(() => {});
    process.exitCode = 1;
});
