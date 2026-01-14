import mongoose, { Schema, Document } from 'mongoose';

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

const ProblemSchema = new Schema<IProblem>({
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
  metadata: Schema.Types.Mixed,
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
ProblemSchema.index({ problem_id: 1 }, { unique: true });
ProblemSchema.index({ session_id: 1 });
ProblemSchema.index({ age_group: 1, level_number: 1 });
ProblemSchema.index({ age_group: 1, level_number: 1, session_id: 1 });

export const Problem = mongoose.models.Problem || mongoose.model<IProblem>('Problem', ProblemSchema);
