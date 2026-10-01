const mongoose = require('mongoose');
const slugify = require('slugify');

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'يجب إدخال اسم الشركة'],
            trim: true,
            maxlength: [120, 'اسم الشركة يجب ألا يزيد عن 120 حرفًا'],
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'وصف الشركة طويل جدًا'],
        },
        industry: {
            type: String,
            trim: true,
            maxlength: [120, 'اسم المجال يجب ألا يزيد عن 120 حرفًا'],
        },
        website: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        logo: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
            trim: true,
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

companySchema.virtual('projects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'company',
});

const createSlug = (name, id) => {
    const slug = slugify(name, { lower: true, strict: true, trim: true });
    return slug || `company-${id}`;
};

companySchema.pre('validate', function () {
    if (this.isModified('name') || !this.slug) {
        this.slug = createSlug(this.name, this._id);
    }
});

companySchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() || {};
    const name = update.name || update.$set?.name;
    if (!name) return;

    const slug = createSlug(name, this.getQuery()._id || 'updated');
    if (update.$set) update.$set.slug = slug;
    else update.slug = slug;
    this.setUpdate(update);
});

companySchema.pre(/^find/, function () {
    if (!this.getOptions().includeInactive) {
        this.find({ active: { $ne: false } });
    }
});

module.exports = mongoose.model('Company', companySchema);
