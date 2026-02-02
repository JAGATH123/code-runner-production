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
exports.Problem = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProblemSchema = new mongoose_1.Schema({
    problem_id: {
        type: Number,
        required: true,
        unique: true,
    },
    session_id: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    question: String,
    objectives: String,
    concepts: String,
    difficulty: {
        type: String,
        enum: ['Intro', 'Easy', 'Medium', 'Hard'],
        required: true,
    },
    estimated_minutes: Number,
    example_code: {
        type: String,
        required: true,
    },
    sample_input: {
        type: String,
        required: true,
    },
    sample_output: {
        type: String,
        required: true,
    },
    session_title: String,
    session_introduction: String,
    case_number: Number,
    case_title: String,
    case_overview: String,
    case_code: String,
    case_explanation: String,
    age_group: {
        type: String,
        enum: ['11-14', '15-18'],
    },
    level_number: Number,
    metadata: mongoose_1.Schema.Types.Mixed,
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, {
    collection: 'problems',
});
// Indexes
// Note: problem_id unique index is automatically created by 'unique: true' in schema
ProblemSchema.index({ session_id: 1 });
ProblemSchema.index({ age_group: 1, level_number: 1 });
ProblemSchema.index({ age_group: 1, level_number: 1, session_id: 1 });
exports.Problem = mongoose_1.default.models.Problem || mongoose_1.default.model('Problem', ProblemSchema);
//# sourceMappingURL=Problem.model.js.map