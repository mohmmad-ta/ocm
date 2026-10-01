const express = require('express');
const { getAllProjects, getProject } = require('../controllers/projectController');

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:identifier', getProject);

module.exports = router;
