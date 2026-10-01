const mongoose = require('mongoose');

const heroVideoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'يجب إدخال اسم فيديو الواجهة'],
            trim: true,
            maxlength: [120, 'الاسم يجب ألا يزيد عن 120 حرفًا'],
        },
        video: {
            type: String,
            required: [true, 'يجب رفع فيديو الواجهة'],
        },
        poster: {
            type: String,
            default: null,
        },
        image: {
            type: String,
            default: null,
        },
        active: {
            type: Boolean,
            default: true,
            index: true,
        },
        autoplay: {
            type: Boolean,
            default: true,
        },
        muted: {
            type: Boolean,
            default: true,
        },
        loop: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HeroVideo', heroVideoSchema);
