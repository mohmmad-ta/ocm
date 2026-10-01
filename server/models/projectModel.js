const mongoose = require('mongoose');
const slugify = require('slugify');

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'يجب إدخال اسم المشروع'],
            trim: true,
            maxlength: [120, 'اسم المشروع يجب ألا يزيد عن 120 حرفًا'],
            minlength: [3, 'اسم المشروع يجب ألا يقل عن 3 أحرف'],
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'وصف المشروع طويل جدًا'],
        },
        company: {
            type: mongoose.Schema.ObjectId,
            ref: 'Company',
            required: [true, 'يجب تحديد الشركة المرتبطة بالمشروع'],
            index: true,
        },
        year: {
            type: Number,
            min: 1900,
            max: 2200,
        },
        services: {
            type: [String],
            default: [],
        },
        category: {
            type: mongoose.Schema.ObjectId,
            required: [true, 'يجب إدخال تصنيف المشروع'],
            ref: 'Category',
        },
        image: {
            type: String,
            required: [true, 'يجب إدخال صورة للمشروع'],
        },
        images: {
            type: [String],
            validate: {
                validator: (images) => images.length <= 8,
                message: 'يمكن حفظ 8 صور كحد أقصى.',
            },
            default: [],
        },
        video: {
            type: String,
            default: null,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const createSlug = (name, id) => {
    const slug = slugify(name, { lower: true, strict: true, trim: true });
    return slug || `project-${id}`;
};

projectSchema.pre('validate', function () {
    if (this.isModified('name') || !this.slug) {
        this.slug = createSlug(this.name, this._id);
    }
});

projectSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() || {};
    const name = update.name || update.$set?.name;
    if (!name) return;

    const slug = createSlug(name, this.getQuery()._id || 'updated');
    if (update.$set) update.$set.slug = slug;
    else update.slug = slug;
    this.setUpdate(update);
});

projectSchema.pre(/^find/, function () {
    if (!this.getOptions().includeInactive) {
        this.find({ active: { $ne: false } });
    }

    this.populate({
        path: 'category',
        select: '-__v -createdAt -updatedAt',
    });
    this.populate({
        path: 'company',
        select: 'name slug industry website logo image active',
    });
});

module.exports = mongoose.model('Project', projectSchema);
