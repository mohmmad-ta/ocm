const express = require('express');
const { getActiveHeroVideo } = require('../controllers/heroVideoController');

const router = express.Router();

router.get('/', getActiveHeroVideo);

module.exports = router;
