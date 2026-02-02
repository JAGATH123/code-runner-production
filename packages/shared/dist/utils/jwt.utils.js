"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Lazy validation - only validate when JWT functions are called
// This allows dotenv to load first in index.ts
let JWT_SECRET = null;
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
function getJWTSecret() {
    if (JWT_SECRET) {
        return JWT_SECRET;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
        throw new Error('FATAL: JWT_SECRET must be at least 32 characters');
    }
    const WEAK_SECRETS = ['secret', 'default', 'password', 'jwt_secret', 'change-in-production'];
    if (WEAK_SECRETS.some(weak => secret.toLowerCase().includes(weak))) {
        throw new Error('FATAL: JWT_SECRET appears to be a weak/default value');
    }
    JWT_SECRET = secret;
    return JWT_SECRET;
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJWTSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getJWTSecret());
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
}
function decodeToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=jwt.utils.js.map