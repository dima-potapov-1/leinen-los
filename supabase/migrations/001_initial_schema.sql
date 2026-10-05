-- Leinen los! — Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- Questions table
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id              integer PRIMARY KEY,
    topic           text NOT NULL CHECK (topic IN ('basis', 'binnen', 'segeln')),
    topic_name_de   text NOT NULL DEFAULT '',
    topic_name_en   text NOT NULL DEFAULT '',
    topic_name_ru   text NOT NULL DEFAULT '',
    question_de     text NOT NULL,
    question_en     text NOT NULL DEFAULT '',
    question_ru     text NOT NULL DEFAULT '',
    image_url       text,
    options         jsonb NOT NULL,
    correct_option  integer NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
    explanations    jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE questions IS 'Official SBF Binnen exam questions (300 total)';

-- ============================================================
-- Profiles table (created on user registration)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    display_name    text,
    preferences     jsonb NOT NULL DEFAULT '{
        "language_pair": "de-en",
        "session_size": 10,
        "exam_date": null,
        "streak_count": 0,
        "last_study_date": null
    }'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles with study preferences';

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- User progress table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
    user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_id         integer NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    mastery             text NOT NULL DEFAULT 'unseen' CHECK (mastery IN ('unseen', 'learning', 'familiar')),
    consecutive_correct integer NOT NULL DEFAULT 0,
    attempts            integer NOT NULL DEFAULT 0,
    correct_count       integer NOT NULL DEFAULT 0,
    bookmarked          boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
);

COMMENT ON TABLE user_progress IS 'Per-user per-question learning state';

CREATE INDEX IF NOT EXISTS idx_user_progress_mastery
    ON user_progress(user_id, mastery);

CREATE INDEX IF NOT EXISTS idx_user_progress_bookmarked
    ON user_progress(user_id, bookmarked) WHERE bookmarked = true;

-- ============================================================
-- Exam attempts table
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_attempts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exam_type       text NOT NULL DEFAULT 'motor_segel' CHECK (exam_type IN ('motor_segel', 'motor', 'segel')),
    paper_id        integer NOT NULL,
    started_at      timestamptz NOT NULL DEFAULT now(),
    finished_at     timestamptz,
    basis_correct   integer NOT NULL DEFAULT 0,
    binnen_correct  integer NOT NULL DEFAULT 0,
    segel_correct   integer,
    passed          boolean NOT NULL DEFAULT false,
    answers         jsonb NOT NULL DEFAULT '[]'::jsonb
);

COMMENT ON TABLE exam_attempts IS 'Simulated exam attempt records';

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user
    ON exam_attempts(user_id, started_at DESC);

-- ============================================================
-- Row Level Security (RLS) — v2, but enable tables now
-- ============================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Questions are public (read-only for everyone)
CREATE POLICY "Questions are readable by everyone"
    ON questions FOR SELECT
    USING (true);

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- User progress: users can CRUD their own
CREATE POLICY "Users can view own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Exam attempts: users can read/insert their own
CREATE POLICY "Users can view own exams"
    ON exam_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams"
    ON exam_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
    ON exam_attempts FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
