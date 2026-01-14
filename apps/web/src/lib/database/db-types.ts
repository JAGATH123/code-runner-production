import { ObjectId } from 'mongodb';

export interface DBProblem {
  _id?: ObjectId;
  problem_id: number;
  session_id: number;
  title: string;
  description: string;
  question?: string; // Main question/task for the student
  difficulty: string;
  compiler_comment: string;
  sample_input: string;
  sample_output: string;
  age_group: string;
  level_number: number;
  metadata?: {
    concepts?: string[];
    space_theme?: boolean;
    estimated_time_minutes?: number;
    story_linked?: boolean;
    is_final_task?: boolean;
    is_capstone?: boolean;
    is_code_convergence?: boolean;
    unlocks_next_level?: boolean;
    galactic_command_phase?: string;
    narrative_beat?: string;
    prerequisite_sessions?: number[];
    [key: string]: any; // Allow additional metadata fields
  };

  // Session-level content (for educational problems)
  session_title?: string;
  session_introduction?: string;

  // Case-specific content (for educational problems with multiple cases)
  case_number?: number;
  case_title?: string;
  case_overview?: string;
  case_code?: string;
  case_explanation?: string;

  created_at: Date;
  updated_at: Date;
}

export interface DBTestCase {
  _id?: ObjectId;
  problem_id: number;
  test_case_id: number;
  input: string;
  expected_output: string;
  is_hidden: boolean; // Some test cases hidden from students
  weight: number; // For scoring
  created_at: Date;
}

export interface DBSession {
  _id?: ObjectId;
  session_id: number;
  level_id: number;
  session_number: number;
  title: string;
  description: string;
  introduction_content?: string;
  problem_ids: number[];
  metadata: {
    estimated_time_hours: number;
    prerequisites: number[]; // session_ids
  };
  created_at: Date;
  updated_at: Date;
}

export interface DBLevel {
  _id?: ObjectId;
  level_id: number;
  level_number: number;
  title: string;
  age_group: string;
  description: string;
  session_ids: number[];
  metadata: {
    total_sessions: number;
    difficulty_progression: string[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface DBUserProgress {
  _id?: ObjectId;
  user_id: string;
  age_group: string;
  completed_problems: number[];
  completed_sessions: number[];
  completed_levels: number[];
  current_session: number;
  current_level: number;
  total_points: number;
  achievements: string[];
  last_activity: Date;
  created_at: Date;
  updated_at: Date;
}

// Conversion utilities to maintain compatibility with existing types
export interface Problem {
  problem_id: number;
  session_id?: number;
  title: string;
  description: string;
  difficulty: string;
  compiler_comment: string;
  sample_input: string;
  sample_output: string;
  age_group?: string;
  level_number?: number;
  metadata?: {
    concepts?: string[];
    space_theme?: boolean;
    estimated_time_minutes?: number;
    story_linked?: boolean;
    is_final_task?: boolean;
    is_capstone?: boolean;
    is_code_convergence?: boolean;
    unlocks_next_level?: boolean;
    galactic_command_phase?: string;
    narrative_beat?: string;
    prerequisite_sessions?: number[];
    [key: string]: any;
  };

  // Session-level content
  session_title?: string;
  session_introduction?: string;

  // Case-specific content
  case_number?: number;
  case_title?: string;
  case_overview?: string;
  case_code?: string;
  case_explanation?: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Session {
  session_id: number;
  level_id: number;
  session_number: number;
  title: string;
  description: string;
  introduction_content?: string;
  problems: Problem[];
}

export interface Level {
  level_id: number;
  level_number: number;
  title: string;
  age_group: string;
  description: string;
  sessions: Session[];
}

// Converter functions
export function dbProblemToProblem(dbProblem: DBProblem): Problem {
  return {
    problem_id: dbProblem.problem_id,
    session_id: dbProblem.session_id,
    title: dbProblem.title,
    description: dbProblem.description,
    question: dbProblem.question,
    difficulty: dbProblem.difficulty,
    compiler_comment: dbProblem.compiler_comment,
    sample_input: dbProblem.sample_input,
    sample_output: dbProblem.sample_output,
    age_group: dbProblem.age_group,
    level_number: dbProblem.level_number,
    metadata: dbProblem.metadata,

    // Session-level content
    session_title: dbProblem.session_title,
    session_introduction: dbProblem.session_introduction,

    // Case-specific content
    case_number: dbProblem.case_number,
    case_title: dbProblem.case_title,
    case_overview: dbProblem.case_overview,
    case_code: dbProblem.case_code,
    case_explanation: dbProblem.case_explanation,
  };
}

export function dbTestCaseToTestCase(dbTestCase: DBTestCase): TestCase {
  return {
    input: dbTestCase.input,
    expected_output: dbTestCase.expected_output,
  };
}