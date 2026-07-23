/*
  # Enforce strictly admin-mediated conversations

  ## Problem
  Conversation rows could previously be inserted directly by any
  authenticated client (`tenant_id = auth.uid() OR owner_id = auth.uid()`),
  and the "accept candidate" flow created a conversation with
  `tenant_id = <real tenant>` and `owner_id = <real owner>` directly -
  a genuine bypass of the admin-mediation design already described in
  the `conversation_type` migration's own comments. That direct channel
  let a tenant and an owner/agent message each other with no admin in
  the loop, which is exactly what must never be possible: every deal
  must be brokered through the platform.

  ## Fix
  - Two SECURITY DEFINER functions become the *only* way conversations
    tied to an interest are created. They run as the function owner
    (bypassing RLS internally) but strictly validate the caller's
    identity and role before doing anything, and never accept a
    caller-supplied counterpart id - the admin is always looked up
    server-side.
  - The generic "insert whatever conversation you like" policy is
    dropped. Regular authenticated clients can no longer INSERT into
    `conversations` at all; only these two functions can.
  - A missing UPDATE policy on `tenant_interests` (owners had no way to
    legitimately change a candidate's status) is added, scoped to the
    property's owner only.
*/

-- ============================================================
-- 1. Owners can update the status of interests on their own properties
-- ============================================================

DROP POLICY IF EXISTS "Owners can update interests on their properties" ON public.tenant_interests;

CREATE POLICY "Owners can update interests on their properties"
  ON public.tenant_interests FOR UPDATE
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
-- 2. Lock down direct conversation inserts - only the functions below
--    (running as their owner, bypassing RLS) may create conversations.
-- ============================================================

DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;

-- ============================================================
-- 3. submit_tenant_interest: a searcher expressing interest in a
--    property. Creates the interest plus the searcher<->admin and
--    owner<->admin conversation pair. The admin is always resolved
--    here, server-side - never supplied by the client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_tenant_interest(
  p_property_id uuid,
  p_message text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid := auth.uid();
  v_owner_id uuid;
  v_admin_id uuid;
  v_interest_id uuid;
  v_searcher_conv_id uuid;
  v_owner_conv_id uuid;
BEGIN
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT owner_id INTO v_owner_id FROM public.properties WHERE id = p_property_id;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No administrator available to mediate this request';
  END IF;

  INSERT INTO public.tenant_interests (tenant_id, property_id, message, status)
  VALUES (v_tenant_id, p_property_id, coalesce(p_message, ''), 'pending')
  ON CONFLICT (tenant_id, property_id) DO UPDATE SET message = excluded.message
  RETURNING id INTO v_interest_id;

  INSERT INTO public.conversations (
    property_id, tenant_id, owner_id, interest_id, status, conversation_type, admin_id
  )
  VALUES (
    p_property_id, v_tenant_id, v_admin_id, v_interest_id, 'active', 'searcher_admin', v_admin_id
  )
  ON CONFLICT (property_id, tenant_id) DO UPDATE SET interest_id = excluded.interest_id
  RETURNING id INTO v_searcher_conv_id;

  INSERT INTO public.conversations (
    property_id, tenant_id, owner_id, interest_id, status, conversation_type, admin_id, related_conversation_id
  )
  VALUES (
    p_property_id, v_admin_id, v_owner_id, v_interest_id, 'active', 'owner_admin', v_admin_id, v_searcher_conv_id
  )
  ON CONFLICT (property_id, tenant_id) DO UPDATE SET interest_id = excluded.interest_id
  RETURNING id INTO v_owner_conv_id;

  UPDATE public.conversations SET related_conversation_id = v_owner_conv_id WHERE id = v_searcher_conv_id;

  RETURN v_searcher_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_tenant_interest(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_tenant_interest(uuid, text) TO authenticated;

-- ============================================================
-- 4. respond_to_tenant_interest: the property owner accepting or
--    rejecting a candidate. Ownership of the property is verified
--    server-side; the caller cannot target someone else's interests.
--    Accepting never creates a direct owner<->tenant conversation -
--    only the same admin-mediated pair used above.
-- ============================================================

CREATE OR REPLACE FUNCTION public.respond_to_tenant_interest(
  p_interest_id uuid,
  p_new_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid := auth.uid();
  v_property_id uuid;
  v_tenant_id uuid;
  v_real_owner_id uuid;
  v_admin_id uuid;
  v_owner_conv_id uuid;
  v_searcher_conv_id uuid;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_new_status NOT IN ('reviewed', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT ti.property_id, ti.tenant_id, p.owner_id
    INTO v_property_id, v_tenant_id, v_real_owner_id
  FROM public.tenant_interests ti
  JOIN public.properties p ON p.id = ti.property_id
  WHERE ti.id = p_interest_id;

  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Interest not found';
  END IF;

  IF v_real_owner_id <> v_owner_id THEN
    RAISE EXCEPTION 'Not authorized to respond to this interest';
  END IF;

  UPDATE public.tenant_interests SET status = p_new_status, updated_at = now() WHERE id = p_interest_id;

  IF p_new_status <> 'accepted' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No administrator available to mediate this request';
  END IF;

  INSERT INTO public.conversations (
    property_id, tenant_id, owner_id, interest_id, status, conversation_type, admin_id
  )
  VALUES (
    v_property_id, v_tenant_id, v_admin_id, p_interest_id, 'active', 'searcher_admin', v_admin_id
  )
  ON CONFLICT (property_id, tenant_id) DO UPDATE SET interest_id = excluded.interest_id
  RETURNING id INTO v_searcher_conv_id;

  INSERT INTO public.conversations (
    property_id, tenant_id, owner_id, interest_id, status, conversation_type, admin_id, related_conversation_id
  )
  VALUES (
    v_property_id, v_admin_id, v_real_owner_id, p_interest_id, 'active', 'owner_admin', v_admin_id, v_searcher_conv_id
  )
  ON CONFLICT (property_id, tenant_id) DO UPDATE SET interest_id = excluded.interest_id
  RETURNING id INTO v_owner_conv_id;

  UPDATE public.conversations SET related_conversation_id = v_owner_conv_id WHERE id = v_searcher_conv_id;

  RETURN v_owner_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_tenant_interest(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.respond_to_tenant_interest(uuid, text) TO authenticated;
