/*
  # Fix Security Issues: Indexes and RLS Performance

  ## Summary
  Addresses all Supabase security advisor warnings:

  1. **Missing FK indexes** - Adds covering indexes for all unindexed foreign keys to improve JOIN performance
  2. **RLS auth() re-evaluation** - Replaces `auth.uid()` with `(select auth.uid())` in all policies to prevent
     per-row function re-evaluation, dramatically improving query performance at scale
  3. **Multiple permissive policies** - Merges duplicate SELECT policies on profiles, properties, and tenant_interests
     into single consolidated policies

  ## Tables Modified
  - conversations: indexes on interest_id, owner_id, tenant_id
  - favorites: index on property_id
  - messages: index on sender_id
  - profiles: indexes on city_id, commune_id; RLS policies updated
  - user_subscriptions: indexes on plan_id, user_id; RLS policies updated
  - properties: RLS policies updated; merged SELECT policies
  - property_images: RLS policies updated
  - owner_criteria: RLS policies updated
  - tenant_interests: RLS policies updated; merged SELECT policies
  - conversations: RLS policies updated
  - messages: RLS policies updated
  - favorites: RLS policies updated
  - daily_usage: RLS policies updated

  ## Security Notes
  - No data is dropped or modified
  - All RLS policies maintain the same security semantics
  - Only performance optimization via `(select auth.uid())` pattern
*/

-- ============================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_conversations_interest_id ON public.conversations(interest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_commune_id ON public.profiles(commune_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- ============================================================
-- 2. FIX RLS POLICIES ON profiles
-- ============================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read anonymous_id and display_name only" ON public.profiles;

-- Single consolidated SELECT policy (replaces both overlapping SELECT policies)
CREATE POLICY "Users can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================
-- 3. FIX RLS POLICIES ON properties
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read approved/active properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can read their own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;

-- Single consolidated SELECT policy
CREATE POLICY "Anyone can read properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (
    status IN ('approved', 'active')
    OR owner_id = (select auth.uid())
  );

CREATE POLICY "Owners can insert their own properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can update their own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

-- ============================================================
-- 4. FIX RLS POLICIES ON property_images
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read images of approved properties" ON public.property_images;
DROP POLICY IF EXISTS "Owners can insert images for their properties" ON public.property_images;
DROP POLICY IF EXISTS "Owners can delete their property images" ON public.property_images;

CREATE POLICY "Anyone can read property images"
  ON public.property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
      AND (p.status IN ('approved', 'active') OR p.owner_id = (select auth.uid()))
    )
  );

CREATE POLICY "Owners can insert images for their properties"
  ON public.property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Owners can delete their property images"
  ON public.property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- 5. FIX RLS POLICIES ON owner_criteria
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read owner criteria for approved properties" ON public.owner_criteria;
DROP POLICY IF EXISTS "Owners can insert criteria for their properties" ON public.owner_criteria;
DROP POLICY IF EXISTS "Owners can update their criteria" ON public.owner_criteria;

CREATE POLICY "Anyone can read owner criteria"
  ON public.owner_criteria FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
      AND (p.status IN ('approved', 'active') OR p.owner_id = (select auth.uid()))
    )
  );

CREATE POLICY "Owners can insert criteria for their properties"
  ON public.owner_criteria FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Owners can update their criteria"
  ON public.owner_criteria FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- 6. FIX RLS POLICIES ON tenant_interests
-- ============================================================

DROP POLICY IF EXISTS "Tenants can read their own interests" ON public.tenant_interests;
DROP POLICY IF EXISTS "Tenants can insert their own interests" ON public.tenant_interests;
DROP POLICY IF EXISTS "Property owners can read interests on their properties" ON public.tenant_interests;

-- Single consolidated SELECT policy
CREATE POLICY "Participants can read interests"
  ON public.tenant_interests FOR SELECT
  TO authenticated
  USING (
    tenant_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Tenants can insert their own interests"
  ON public.tenant_interests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select auth.uid()));

-- ============================================================
-- 7. FIX RLS POLICIES ON conversations
-- ============================================================

DROP POLICY IF EXISTS "Participants can read their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;

CREATE POLICY "Participants can read their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    tenant_id = (select auth.uid())
    OR owner_id = (select auth.uid())
  );

CREATE POLICY "Participants can insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (select auth.uid())
    OR owner_id = (select auth.uid())
  );

-- ============================================================
-- 8. FIX RLS POLICIES ON messages
-- ============================================================

DROP POLICY IF EXISTS "Conversation participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;

CREATE POLICY "Conversation participants can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.tenant_id = (select auth.uid()) OR c.owner_id = (select auth.uid()))
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.tenant_id = (select auth.uid()) OR c.owner_id = (select auth.uid()))
    )
  );

-- ============================================================
-- 9. FIX RLS POLICIES ON favorites
-- ============================================================

DROP POLICY IF EXISTS "Users can read own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;

CREATE POLICY "Users can read own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- 10. FIX RLS POLICIES ON user_subscriptions
-- ============================================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own subscriptions"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own subscriptions"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- 11. FIX RLS POLICIES ON daily_usage
-- ============================================================

DROP POLICY IF EXISTS "Users can view own usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.daily_usage;

CREATE POLICY "Users can view own usage"
  ON public.daily_usage FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own usage"
  ON public.daily_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own usage"
  ON public.daily_usage FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
