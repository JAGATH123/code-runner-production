"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@code-runner/shared");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', rateLimit_middleware_1.authLimiter, async (req, res) => {
    try {
        const { username, email, password, age_group } = req.body;
        // Validate inputs
        const usernameValidation = (0, shared_1.validate)(shared_1.usernameSchema, username);
        if (!usernameValidation.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: usernameValidation.errors?.[0] || 'Invalid username',
            });
        }
        const emailValidation = (0, shared_1.validate)(shared_1.emailSchema, email);
        if (!emailValidation.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: emailValidation.errors?.[0] || 'Invalid email',
            });
        }
        const passwordValidation = (0, shared_1.validate)(shared_1.passwordSchema, password);
        if (!passwordValidation.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: passwordValidation.errors?.[0] || 'Invalid password',
            });
        }
        if (age_group !== '11-14' && age_group !== '15-18') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Age group must be "11-14" or "15-18"',
            });
        }
        // Check if user already exists
        const existingUser = await shared_1.Models.User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Username or email already exists',
            });
        }
        // Hash password
        const passwordHash = await (0, shared_1.hashPassword)(password);
        // Create user
        const user = new shared_1.Models.User({
            username,
            email,
            passwordHash,
            age_group,
            role: 'student',
        });
        await user.save();
        // Generate token
        const token = (0, shared_1.generateToken)({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                age_group: user.age_group,
            },
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
/**
 * POST /auth/login
 * Login a user
 */
router.post('/login', rateLimit_middleware_1.authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Username and password are required',
            });
        }
        // Find user
        const user = await shared_1.Models.User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }
        // Verify password
        const isPasswordValid = await (0, shared_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }
        // Generate token
        const token = (0, shared_1.generateToken)({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        });
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                age_group: user.age_group,
            },
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
/**
 * POST /auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
    // For JWT, logout is handled client-side by removing the token
    // This endpoint is just for consistency
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map