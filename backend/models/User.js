import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    otp: { type: String },
    otpExpires: { type: Date },
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


const User = mongoose.model('User', UserSchema);
export default User;
