
-- Revert March 31 security additions

-- 1. Drop order update validation trigger and function
DROP TRIGGER IF EXISTS validate_order_update_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.validate_order_update();

-- 2. Drop documents bucket storage policies
DROP POLICY IF EXISTS "Garage owners can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Garage owners can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- 3. Make the documents bucket public again
UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- 4. Restore profile SELECT policy to public
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT USING (true);

-- 5. Drop length check constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_full_name_length,
  DROP CONSTRAINT IF EXISTS profiles_phone_length,
  DROP CONSTRAINT IF EXISTS profiles_bio_length,
  DROP CONSTRAINT IF EXISTS profiles_location_length;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_length;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_comment_length;

ALTER TABLE public.garages
  DROP CONSTRAINT IF EXISTS garages_name_length,
  DROP CONSTRAINT IF EXISTS garages_description_length,
  DROP CONSTRAINT IF EXISTS garages_address_length,
  DROP CONSTRAINT IF EXISTS garages_phone_length;

ALTER TABLE public.spare_parts
  DROP CONSTRAINT IF EXISTS spare_parts_name_length,
  DROP CONSTRAINT IF EXISTS spare_parts_description_length,
  DROP CONSTRAINT IF EXISTS spare_parts_location_length,
  DROP CONSTRAINT IF EXISTS spare_parts_car_model_length;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_service_requested_length,
  DROP CONSTRAINT IF EXISTS orders_notes_length;
