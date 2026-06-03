
-- Fix 1: Restrict profiles SELECT to authenticated users only (prevents PII exposure to anon)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- Fix 2: Add length constraints for input validation

-- Profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (length(full_name) <= 100),
  ADD CONSTRAINT profiles_phone_length CHECK (length(phone) <= 25),
  ADD CONSTRAINT profiles_bio_length CHECK (length(bio) <= 500),
  ADD CONSTRAINT profiles_location_length CHECK (length(location) <= 200);

-- Messages
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length CHECK (length(content) <= 5000);

-- Reviews
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_comment_length CHECK (length(comment) <= 1000);

-- Garages
ALTER TABLE public.garages
  ADD CONSTRAINT garages_name_length CHECK (length(name) <= 150),
  ADD CONSTRAINT garages_description_length CHECK (length(description) <= 2000),
  ADD CONSTRAINT garages_address_length CHECK (length(address) <= 300),
  ADD CONSTRAINT garages_phone_length CHECK (length(phone) <= 25);

-- Spare parts
ALTER TABLE public.spare_parts
  ADD CONSTRAINT spare_parts_name_length CHECK (length(name) <= 200),
  ADD CONSTRAINT spare_parts_description_length CHECK (length(description) <= 2000),
  ADD CONSTRAINT spare_parts_location_length CHECK (length(location) <= 200),
  ADD CONSTRAINT spare_parts_car_model_length CHECK (length(car_model) <= 100);

-- Orders
ALTER TABLE public.orders
  ADD CONSTRAINT orders_service_requested_length CHECK (length(service_requested) <= 500),
  ADD CONSTRAINT orders_notes_length CHECK (length(notes) <= 1000);
