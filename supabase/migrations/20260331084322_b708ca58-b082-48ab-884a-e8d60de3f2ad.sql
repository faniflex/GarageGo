
-- Fix 1: Storage policy - restrict document reads to actual owners (not all authenticated users)
DROP POLICY IF EXISTS "Garage owners can view own documents" ON storage.objects;

CREATE POLICY "Garage owners can view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'garage-docs'
  AND EXISTS (
    SELECT 1 FROM public.garages
    WHERE garages.id = (storage.foldername(name))[2]::uuid
    AND garages.owner_id = auth.uid()
  )
);

-- Fix 2: Also tighten the INSERT policy to verify garage ownership
DROP POLICY IF EXISTS "Garage owners can upload documents" ON storage.objects;

CREATE POLICY "Garage owners can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'garage-docs'
  AND EXISTS (
    SELECT 1 FROM public.garages
    WHERE garages.id = (storage.foldername(name))[2]::uuid
    AND garages.owner_id = auth.uid()
  )
);

-- Fix 3: Restrict order UPDATE columns via trigger validation
CREATE OR REPLACE FUNCTION public.validate_order_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Customers can only update status (to cancel) and notes
  IF OLD.customer_id = auth.uid() THEN
    IF NEW.garage_id IS DISTINCT FROM OLD.garage_id
       OR NEW.mechanic_id IS DISTINCT FROM OLD.mechanic_id
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.service_requested IS DISTINCT FROM OLD.service_requested
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
      RAISE EXCEPTION 'Customers can only update status and notes';
    END IF;
    -- Customers can only set status to cancelled
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'cancelled' THEN
      RAISE EXCEPTION 'Customers can only cancel orders';
    END IF;
  END IF;

  -- Mechanics can only update status and notes
  IF OLD.mechanic_id = auth.uid() THEN
    IF NEW.garage_id IS DISTINCT FROM OLD.garage_id
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.mechanic_id IS DISTINCT FROM OLD.mechanic_id
       OR NEW.service_requested IS DISTINCT FROM OLD.service_requested
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
      RAISE EXCEPTION 'Mechanics can only update status and notes';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_update_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_update();
