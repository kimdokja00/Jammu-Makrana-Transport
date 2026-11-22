import mongoose from 'mongoose';

const stoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    tagline: { type: String, default: 'Komal Minerals Supplier' },
    category: { type: String, default: 'Natural Stone', trim: true },
    /** Path relative to the asset CDN, e.g. `products/Marble.jpg` */
    image: { type: String, required: true },
    description: { type: String, default: '' },
    finishes: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    origin: { type: String, default: 'India' },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

stoneSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export const Stone = mongoose.models.Stone || mongoose.model('Stone', stoneSchema);

export default Stone;
