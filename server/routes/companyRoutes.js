const express = require('express');
const { getAllCompanies, getCompany } = require('../controllers/companyController');

const router = express.Router();

router.get('/', getAllCompanies);
router.get('/:identifier', getCompany);

module.exports = router;
