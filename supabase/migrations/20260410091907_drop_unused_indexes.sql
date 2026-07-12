/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that have never been used, reducing write overhead and storage usage.

  ## Dropped Indexes
  - idx_profiles_city_id (profiles)
  - idx_profiles_commune_id (profiles)
  - idx_properties_commune_id (properties)
  - idx_favorites_property_id (favorites)
  - idx_conversations_interest_id (conversations)
  - idx_conversations_owner_id (conversations)
  - idx_conversations_tenant_id (conversations)
  - idx_messages_conversation_id (messages)
  - idx_messages_sender_id (messages)
  - idx_user_subscriptions_plan_id (user_subscriptions)
  - idx_user_subscriptions_user_id (user_subscriptions)

  ## Notes
  These indexes were never used by the query planner. Removing them reduces
  write amplification on INSERT/UPDATE/DELETE operations and frees storage.
*/

DROP INDEX IF EXISTS public.idx_profiles_city_id;
DROP INDEX IF EXISTS public.idx_profiles_commune_id;
DROP INDEX IF EXISTS public.idx_properties_commune_id;
DROP INDEX IF EXISTS public.idx_favorites_property_id;
DROP INDEX IF EXISTS public.idx_conversations_interest_id;
DROP INDEX IF EXISTS public.idx_conversations_owner_id;
DROP INDEX IF EXISTS public.idx_conversations_tenant_id;
DROP INDEX IF EXISTS public.idx_messages_conversation_id;
DROP INDEX IF EXISTS public.idx_messages_sender_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_plan_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id;
