import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from 'dotenv';
dotenv.config();

// Middleware to verify JWT and attach user to request
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }
};


// Middleware for role-based access
export const adminOnly = (req, res, next) => {

    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only!" });
    }
};

// Middleware to check if user is blocked
export const checkBlocked = async (req, res, next) => {
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(req.body.receiverId);

    if (sender.blockedUsers.includes(receiver.id) || receiver.blockedUsers.includes(sender.id)) {
        return res.status(403).json({ message: 'Action not allowed. One of the users is blocked.' });
    }

    next();
};
