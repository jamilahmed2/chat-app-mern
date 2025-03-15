import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    otp: { type: String },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of blocked users
    reports: [{
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        createdAt: { type: Date, default: Date.now }
    }],
    isBanned: { type: Boolean, default: false },
}, { timestamps: true });

// // Hash password before saving
// UserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
// });

// // Compare passwords
// UserSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

const User = mongoose.model('User', UserSchema);
export default User;
