// User Profile Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  joinDate: Date;
  lastActive: Date;
  rank: 'NOVICE' | 'ADVANCED' | 'EXPERT' | 'MASTER';
  level: number;
  experience: number;
  streak: {
    current: number;
    longest: number;
    lastSubmissionDate: Date;
  };
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalSubmissions: number;
    acceptanceRate: number;
  };
  contestRating: number;
  achievements: Achievement[];
  skills: Skill[];
  recentActivity: ActivityEntry[];
  submissionCalendar: SubmissionDay[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: 'SOLVING' | 'STREAK' | 'SPEED' | 'MASTERY' | 'MILESTONE';
}

export interface Skill {
  name: string;
  level: number;
  problemCount: number;
  category: 'LANGUAGE' | 'ALGORITHM' | 'DATA_STRUCTURE' | 'CONCEPT';
}

export interface ActivityEntry {
  id: string;
  type: 'SOLVED' | 'ATTEMPTED' | 'ACHIEVEMENT' | 'STREAK';
  problemId?: number;
  problemTitle?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  timestamp: Date;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface SubmissionDay {
  date: string; // YYYY-MM-DD format
  count: number;
  problems: number[];
}

// Authentication Types (NEW)
export interface User {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  age_group: '11-14' | '15-18';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  userId: string;
  username: string;
  role: 'student' | 'admin';
  iat: number;
  exp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  age_group: '11-14' | '15-18';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'student' | 'admin';
    age_group: '11-14' | '15-18';
  };
}
