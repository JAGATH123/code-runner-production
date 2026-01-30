import mongoose, { Schema, Document } from 'mongoose';

export interface ICheatSheetBox {
  number: number;           // 1, 2, 3, 4, 5
  title: string;            // "Simple Message"
  description: string;      // "Use print() to make your program talk."
  code_example: string;     // Code snippet in green
  tip: string;              // Tip text on the right side
}

export interface ICheatSheet extends Document {
  session_id: number;           // Link to session (unique per session)
  age_group: '11-14' | '15-18'; // Age group
  level_number: number;         // Level 1-4
  title: string;                // "Python Output Cheatsheet"
  subtitle: string;             // "QUICK REFERENCE"
  boxes: ICheatSheetBox[];      // Array of exactly 5 boxes
  template_version: string;     // 'v1', 'v2', etc.
  created_at: Date;
  updated_at: Date;
}

const CheatSheetBoxSchema = new Schema<ICheatSheetBox>({
  number: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  code_example: {
    type: String,
    required: true,
  },
  tip: {
    type: String,
    required: true,
  },
}, { _id: false });

const CheatSheetSchema = new Schema<ICheatSheet>({
  session_id: {
    type: Number,
    required: true,
    unique: true, // One cheat sheet per session
  },
  age_group: {
    type: String,
    enum: ['11-14', '15-18'],
    required: true,
  },
  level_number: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
    default: 'QUICK REFERENCE',
  },
  boxes: {
    type: [CheatSheetBoxSchema],
    required: true,
    validate: [
      (val: ICheatSheetBox[]) => val.length === 5,
      'Cheat sheet must have exactly 5 boxes'
    ]
  },
  template_version: {
    type: String,
    default: 'v1',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'cheat_sheets',
});

// Indexes
// Note: session_id unique index is automatically created by 'unique: true' in schema
CheatSheetSchema.index({ age_group: 1, level_number: 1 });

// Update the updated_at timestamp before saving
CheatSheetSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const CheatSheet = mongoose.models.CheatSheet ||
  mongoose.model<ICheatSheet>('CheatSheet', CheatSheetSchema);
