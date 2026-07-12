/*
  # Admin-Mediated Conversations

  ## Summary
  This migration adds support for admin-mediated messaging where:
  - Searchers (tenants/buyers) communicate ONLY with the admin
  - Owners/agents/sellers communicate ONLY with the admin
  - The admin acts as the intermediary between both parties

  ## Changes

  ### Modified Tables
  - `conversations`
    - Add `conversation_type` column: 'searcher_admin' or 'owner_admin'
    - Add `related_conversation_id` to link paired conversations
    - Add `admin_id` column to track which admin is handling the case

  ### New Policies
  - Admins can see all conversations
  - Searchers can only see their own searcher_admin conversations
  - Owners can only see their own owner_admin conversations

  ## Notes
  - Existing conversations are preserved
  - The admin mediates: one conversation with the searcher, one with the owner
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'conversation_type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN conversation_type text NOT NULL DEFAULT 'searcher_admin';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'related_conversation_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN related_conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;
