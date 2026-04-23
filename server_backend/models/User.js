const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please fill a valid email address'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['citizen', 'admin', 'officer', 'super-admin'], default: 'citizen' },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    profilePic: { type: String, trim: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active', index: true },
    activeCases: { type: Number, default: 0, min: 0 },
    activityLogs: [
      {
        action: { type: String, trim: true },
        message: { type: String, trim: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false, transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
    } },
    toObject: { virtuals: true },
  }
);



userSchema.pre('save', async function () {
  // Only hash when the password has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    this.password = await bcrypt.hash(this.password, rounds);
  } catch (err) {
    // rethrow so save fails with a meaningful error
    throw err;
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!candidate) return false;
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidate, this.password);
  } catch (err) {
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
