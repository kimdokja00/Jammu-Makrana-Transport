import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, sparse: true, index: true, default: null },
    avatar: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, maxlength: 120, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
