// Problem and Curriculum Types
export interface Problem {
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

  // Session-level content
  session_title?: string;
  session_introduction?: string;

  // Case-specific content
  case_number?: number;
  case_title?: string;
  case_overview?: string;
  case_code?: string;
  case_explanation?: string;

  // Additional metadata
  age_group?: '11-14' | '15-18';
  level_number?: number;
  metadata?: {
    concepts?: string[];
    space_theme?: boolean;
    is_code_convergence?: boolean;
    story_linked?: boolean;
    estimated_time_minutes?: number;
    prerequisites?: string[];
    [key: string]: any;
  };
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
  age_group: '11-14' | '15-18';
  description?: string;
  sessions: Session[];
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  weight?: number;
}
