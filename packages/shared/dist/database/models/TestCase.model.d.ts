import mongoose, { Document } from 'mongoose';
export interface ITestCase extends Document {
    problem_id: number;
    test_case_id: number;
    input: string;
    expected_output: string;
    is_hidden: boolean;
    weight: number;
    created_at: Date;
}
export declare const TestCase: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=TestCase.model.d.ts.map