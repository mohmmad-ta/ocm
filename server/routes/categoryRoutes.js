const express = require('express');
const {createCategory, deleteCategory, getAllCategory, getCategory, updateCategory} = require('./../controllers/categoryController');
const {restrictTo, protect} = require('./../controllers/auth/authController');

const router = express.Router({ mergeParams: true });


router
    .route('/')
    .get(getAllCategory)
    .post(
        protect(),
        restrictTo('admin'),
        createCategory
    );

router
    .route('/:id')
    .get(getCategory)
    .patch(
        protect(),
        restrictTo('admin'),
        updateCategory
    )
    .delete(
        protect(),
        restrictTo('admin'),
        deleteCategory
    );

module.exports = router;
