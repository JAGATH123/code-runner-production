"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-runner';
const connection = {
    isConnected: false,
};
async function connectToDatabase() {
    if (connection.isConnected) {
        console.log('Using existing MongoDB connection');
        return mongoose_1.default;
    }
    try {
        const db = await mongoose_1.default.connect(MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        connection.isConnected = db.connections[0].readyState === 1;
        console.log('Connected to MongoDB via Mongoose');
        return mongoose_1.default;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}
async function disconnectFromDatabase() {
    if (!connection.isConnected) {
        return;
    }
    await mongoose_1.default.disconnect();
    connection.isConnected = false;
    console.log('Disconnected from MongoDB');
}
//# sourceMappingURL=connection.js.map