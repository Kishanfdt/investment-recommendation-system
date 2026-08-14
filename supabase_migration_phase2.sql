-- ============================================================
-- Phase 2 migration: link Supabase Auth to investor_profiles
-- Safe to re-run: all CREATE POLICY statements are guarded
-- ============================================================

-- 1. Add nullable user_id column (IF NOT EXISTS = safe to re-run)
ALTER TABLE investor_profiles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id
  ON investor_profiles(user_id);

-- 3. investor_profiles RLS policies (drop first so re-run is safe)
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert during onboarding"    ON investor_profiles;
DROP POLICY IF EXISTS "Users read own profile"            ON investor_profiles;
DROP POLICY IF EXISTS "Users update own profile"          ON investor_profiles;

CREATE POLICY "Allow insert during onboarding"
  ON investor_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own profile"
  ON investor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON investor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. risk_questionnaire_responses RLS policies
ALTER TABLE risk_questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow questionnaire insert"   ON risk_questionnaire_responses;
DROP POLICY IF EXISTS "Users read own questionnaire" ON risk_questionnaire_responses;
DROP POLICY IF EXISTS "Users update own questionnaire" ON risk_questionnaire_responses;

CREATE POLICY "Allow questionnaire insert"
  ON risk_questionnaire_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own questionnaire"
  ON risk_questionnaire_responses FOR SELECT
  USING (
    profile_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own questionnaire"
  ON risk_questionnaire_responses FOR UPDATE
  USING (
    profile_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );

-- 5. risk_profiles RLS policies
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow risk profile insert"   ON risk_profiles;
DROP POLICY IF EXISTS "Users read own risk profile" ON risk_profiles;
DROP POLICY IF EXISTS "Users update own risk profile" ON risk_profiles;

CREATE POLICY "Allow risk profile insert"
  ON risk_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own risk profile"
  ON risk_profiles FOR SELECT
  USING (
    profile_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own risk profile"
  ON risk_profiles FOR UPDATE
  USING (
    profile_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );
