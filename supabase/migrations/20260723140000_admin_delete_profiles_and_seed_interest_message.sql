/*
  # Admin can delete profiles; seed the tenant's interest message

  ## Problem 1
  There was no DELETE policy on `profiles` at all. RLS defaults to deny,
  so the admin "Supprimer le compte" action silently affected 0 rows -
  no error is raised by a DELETE that matches nothing, so the client's
  optimistic UI update made it look like it worked. The row reappeared
  on every refresh because it was never actually deleted.

  ## Problem 2
  submit_tenant_interest() created the searcher<->admin conversation but
  never inserted the tenant's message into `messages` - the interest's
  note text lived only in `tenant_interests.message`, which the
  conversation screen never reads. The admin opened a technically valid,
  but empty, conversation and never saw what the client actually wrote.
*/

-- ============================================================
-- 1. Admins can delete any profile; a user can delete their own.
-- ============================================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = (select auth.uid()) AND me.role = 'admin'
    )
  );

-- ============================================================
-- 2. Re-create submit_tenant_interest to also seed the initial message
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
  v_clean_message text := trim(coalesce(p_message, ''));
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
  VALUES (v_tenant_id, p_property_id, v_clean_message, 'pending')
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

  -- Seed the tenant's own note as the first message so the admin (the
  -- only party who can see this conversation besides the tenant) can
  -- actually read it, instead of it living only in tenant_interests.
  IF v_clean_message <> '' THEN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_searcher_conv_id, v_tenant_id, v_clean_message);

    UPDATE public.conversations SET last_message_at = now() WHERE id = v_searcher_conv_id;
  END IF;

  RETURN v_searcher_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_tenant_interest(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_tenant_interest(uuid, text) TO authenticated;
