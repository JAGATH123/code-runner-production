"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionResult = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExecutionResultSchema = new mongoose_1.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    problemId: Number,
    code: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    result: mongoose_1.Schema.Types.Mixed,
    submissionResult: mongoose_1.Schema.Types.Mixed,
    error: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800, // Auto-delete after 7 days (604800 seconds)
    },
    completedAt: Date,
}, {
    collection: 'execution_results',
});
// Indexes
// Note: jobId unique index and createdAt TTL index are automatically created by schema field definitions
ExecutionResultSchema.index({ userId: 1, createdAt: -1 });
exports.ExecutionResult = mongoose_1.default.models.ExecutionResult || mongoose_1.default.model('ExecutionResult', ExecutionResultSchema);
//# sourceMappingURL=ExecutionResult.model.js.map