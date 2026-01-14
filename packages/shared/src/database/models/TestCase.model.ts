import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase extends Document {
  problem_id: number;
  test_case_id: number;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  weight: number;
  created_at: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  problem_id: {
    type: Number,
    required: true,
  },
  test_case_id: {
    type: Number,
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  expected_output: {
    type: String,
    required: true,
  },
  is_hidden: {
    type: Boolean,
    default: false,
  },
  weight: {
    type: Number,
    default: 1,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'test_cases',
});

// Indexes
TestCaseSchema.index({ problem_id: 1 });
TestCaseSchema.index({ problem_id: 1, is_hidden: 1 });

export const TestCase = mongoose.models.TestCase || mongoose.model<ITestCase>('TestCase', TestCaseSchema);
