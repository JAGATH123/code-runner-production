import mongoose, { Document } from 'mongoose';
export interface IProblem extends Document {
    problem_id: number;
    session_id: number;
    title: string;
    description: string;
    question?: string;
    objectives?: string;
    concepts?: string;
    difficulty: 'Intro' | 'Easy' | 'Medium' | 'Hard';
    estimated_minutes?: number;
    example_code: string;
    sample_input: string;
    sample_output: string;
    session_title?: string;
    session_introduction?: string;
    case_number?: number;
    case_title?: string;
    case_overview?: string;
    case_code?: string;
    case_explanation?: string;
    age_group?: '11-14' | '15-18';
    level_number?: number;
    metadata?: Record<string, any>;
    created_at?: Date;
    updated_at?: Date;
}
export declare const Problem: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=Problem.model.d.ts.map