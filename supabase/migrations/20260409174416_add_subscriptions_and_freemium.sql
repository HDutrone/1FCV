/*
  # Add Subscription Plans and Freemium System

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text) - Plan name (gratuit, premium)
      - `target_role` (text) - tenant or owner
      - `price_cdf` (integer) - Monthly price in CDF
      - `price_usd` (numeric) - Optional USD equivalent
      - `features` (jsonb) - Feature flags and limits
      - `is_active` (boolean) - Whether plan is available
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles)
      - `plan_id` (uuid, FK to subscription_plans)
      - `status` (text) - active, expired, cancelled, trial
      - `payment_method` (text) - mpesa, airtel, orange
      - `payment_reference` (text) - Transaction ID
      - `started_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `trial_ends_at` (timestamptz)
      - `auto_renew` (boolean)
    - `daily_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles)
      - `usage_date` (date)
      - `search_count` (integer)
      - `interest_count` (integer)

  2. Security
    - Enable RLS on all new tables
    - Users can read subscription plans
    - Users can manage their own subscriptions
    - Users can manage their own daily usage
*/

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_role text NOT NULL DEFAULT 'tenant',
  price_cdf integer NOT NULL DEFAULT 0,
  price_usd numeric DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subscription_plans_target_role_check CHECK (target_role = ANY (ARRAY['tenant'::text, 'owner'::text]))
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trial',
  payment_method text DEFAULT '',
  payment_reference text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_subscriptions_status_check CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'trial'::text]))
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  search_count integer DEFAULT 0,
  interest_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT daily_usage_unique UNIQUE (user_id, usage_date)
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON daily_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON daily_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON daily_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO subscription_plans (name, target_role, price_cdf, price_usd, features) VALUES
  ('Gratuit', 'tenant', 0, 0, '{"searches_per_day": 5, "interests_per_week": 3, "alerts": false, "no_ads": false, "priority_visits": false}'::jsonb),
  ('Premium', 'tenant', 10000, 4, '{"searches_per_day": -1, "interests_per_week": -1, "alerts": true, "no_ads": true, "priority_visits": true}'::jsonb),
  ('Gratuit', 'owner', 0, 0, '{"max_listings": 1, "boost": false, "lead_stats": false}'::jsonb),
  ('Premium', 'owner', 20000, 8, '{"max_listings": -1, "boost": true, "lead_stats": true}'::jsonb);
