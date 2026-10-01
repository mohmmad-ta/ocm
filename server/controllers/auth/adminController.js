const Admin = require('../../models/auth/adminModel');
const catchAsync = require('../../utils/catchAsync');


exports.getMeAdmin = catchAsync(async (req, res) => {
    const user = await Admin.findById(req.user.id);
    res.status(200).json({
        status: 'success',
        data: user
    });
});

