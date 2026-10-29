-- ============================================================
-- Migration: Add Clear Termination History RPC and Delete Policy
-- ============================================================

-- 1. Ensure authenticated users have DELETE permission on public.user_terminations
DROP POLICY IF EXISTS "Allow authenticated users to delete termination tracking" ON public.user_terminations;
CREATE POLICY "Allow authenticated users to delete termination tracking"
  ON public.user_terminations
  FOR DELETE
  TO authenticated
  USING (true);

-- 2. Create atomic clear_termination_history RPC function
CREATE OR REPLACE FUNCTION public.clear_termination_history()
RETURNS JSONB AS $$
BEGIN
  DELETE FROM public.user_terminations;
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Termination history cleared successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Grant execute privileges
GRANT EXECUTE ON FUNCTION public.clear_termination_history() TO authenticated, anon;
