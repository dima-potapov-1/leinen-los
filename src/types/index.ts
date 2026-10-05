export interface QuestionOption {
  de: string;
  en: string;
  ru: string;
  highlights_de: string[];
  highlights_en: string[];
  highlights_ru: string[];
}

export interface QuestionExplanation {
  option: number;
  de: string;
  en: string;
  ru: string;
}

export interface Question {
  id: number;
  topic: "basis" | "binnen" | "segeln";
  topic_name_de: string;
  topic_name_en: string;
  topic_name_ru: string;
  question_de: string;
  question_en: string;
  question_ru: string;
  image_url: string | null;
  options: QuestionOption[];
  correct_option: number;
  explanations: QuestionExplanation[];
}

export type Language = "de" | "en" | "ru";
export type Mastery = "unseen" | "learning" | "familiar";
export type ExamType = "motor_segel" | "motor" | "segel";
export type Topic = "basis" | "binnen" | "segeln";
export type QuestionOrder = "random" | "sequential" | "weakest-first";

export interface UserProgress {
  user_id: string;
  question_id: number;
  mastery: Mastery;
  consecutive_correct: number;
  attempts: number;
  correct_count: number;
  bookmarked: boolean;
}

export interface UserPreferences {
  primary_language: Language;
  secondary_language: Language;
  session_size: number;
  question_order: QuestionOrder;
  shuffle_answers: boolean;
  exam_date: string | null;
  streak_count: number;
  last_study_date: string | null;
  explore_positions: Record<string, number>;
  learn_resume_positions?: Record<string, number>;
}

export interface Profile {
  id: string;
  display_name: string | null;
  preferences: UserPreferences;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_type: ExamType;
  paper_id: number;
  started_at: string;
  finished_at: string | null;
  basis_correct: number;
  binnen_correct: number;
  segel_correct: number | null;
  passed: boolean;
  answers: ExamAnswer[];
}

export interface ExamAnswer {
  question_id: number;
  selected_option: number;
  correct: boolean;
}

export interface ExamPaperConfig {
  label: string;
  time_minutes: number;
  pass_rules: {
    basis_min?: number;
    binnen_min?: number;
    segel_min?: number;
    total_min?: number;
  };
}

export interface ExamPaper {
  id: number;
  basis_questions: number[];
  binnen_questions: number[];
  segel_questions: number[];
}
