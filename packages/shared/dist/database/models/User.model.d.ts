import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    role: 'student' | 'admin';
    age_group: '11-14' | '15-18';
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=User.model.d.ts.map