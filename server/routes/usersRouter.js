const { Router } = require('express');
const {
    adminGetAllProjects,
    adminGetProject,
    adminCreateProject,
    adminUpdateProject,
    adminDeleteProject
} = require('../controllers/projectController');
const {getMeAdmin} = require('../controllers/auth/adminController');
const {
    adminGetAllCompanies,
    adminGetCompany,
    adminCreateCompany,
    adminUpdateCompany,
    adminDeleteCompany,
} = require('../controllers/companyController');
const {
    adminGetAllHeroVideos,
    adminGetHeroVideo,
    adminCreateHeroVideo,
    adminUpdateHeroVideo,
    adminDeleteHeroVideo,
} = require('../controllers/heroVideoController');
const {
    loginAdmin,
    logout,
    protect,
    restrictTo,
    checkToken
} = require('../controllers/auth/authController');
const { authLoginLimiter } = require('../utils/securityRateLimiters');
const { parseProjectMultipartFields, uploadProjectMedia } = require('../utils/projectImageUpload');
const { parseHeroMultipartFields, uploadHeroMedia } = require('../utils/heroVideoUpload');

const router = Router();

router.post('/admin/login', authLoginLimiter, loginAdmin);

router.get('/logout', logout);
router.post('/logout', logout);
router.get('/checkToken', checkToken);

router.use(protect(), restrictTo('admin'));

router.get('/admin/getMe', getMeAdmin);

router
    .route('/admin/company')
    .get(adminGetAllCompanies)
    .post(adminCreateCompany);

router
    .route('/admin/company/:id')
    .get(adminGetCompany)
    .patch(adminUpdateCompany)
    .delete(adminDeleteCompany);

router
    .route('/admin/hero-video')
    .get(adminGetAllHeroVideos)
    .post(uploadHeroMedia, parseHeroMultipartFields, adminCreateHeroVideo);

router
    .route('/admin/hero-video/:id')
    .get(adminGetHeroVideo)
    .patch(uploadHeroMedia, parseHeroMultipartFields, adminUpdateHeroVideo)
    .delete(adminDeleteHeroVideo);

router
    .route('/admin/project')
    .get(adminGetAllProjects)
    .post(uploadProjectMedia, parseProjectMultipartFields, adminCreateProject);

router
    .route('/admin/project/:id')
    .get(adminGetProject)
    .patch(uploadProjectMedia, parseProjectMultipartFields, adminUpdateProject)
    .delete(adminDeleteProject);


module.exports = router;
