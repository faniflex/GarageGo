
-- Drop FK constraints that reference auth.users (prevents seeding and is already protected by RLS)
ALTER TABLE public.garages DROP CONSTRAINT IF EXISTS garages_owner_id_fkey;
ALTER TABLE public.spare_parts DROP CONSTRAINT IF EXISTS spare_parts_seller_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Seed sample garages
INSERT INTO public.garages (name, address, rating, review_count, services, phone, verified, image_url, owner_id, description) VALUES
  ('Abyssinia Auto Care', 'Bole Road, Addis Ababa', 4.8, 124, ARRAY['Engine Repair','Oil Change','Tire Service'], '+251 91 234 5678', true, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000001', 'Premier auto care center in the heart of Bole. Specializing in engine repairs and routine maintenance.'),
  ('Merkato Garage Center', 'Merkato, Addis Ababa', 4.5, 89, ARRAY['Body Work','Painting','Electrical'], '+251 91 345 6789', true, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000001', 'Expert body work and painting services at competitive prices.'),
  ('Piassa Motor Works', 'Piassa, Addis Ababa', 4.3, 56, ARRAY['Transmission','Brake Service','Diagnostics'], '+251 91 456 7890', false, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000002', 'Transmission specialists with decades of experience.'),
  ('CMC Auto Repair', 'CMC Area, Addis Ababa', 4.7, 203, ARRAY['Full Service','AC Repair','Suspension'], '+251 91 567 8901', true, 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000002', 'Full-service auto repair shop trusted by thousands of customers.'),
  ('Gerji Express Garage', 'Gerji, Addis Ababa', 4.1, 42, ARRAY['Quick Fix','Battery Service','Towing'], '+251 91 678 9012', true, 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000001', 'Quick and reliable fixes for everyday car troubles.'),
  ('Summit Auto Solutions', 'Summit Area, Addis Ababa', 4.6, 167, ARRAY['Engine Overhaul','Clutch Repair','Exhaust'], '+251 91 789 0123', true, 'https://images.unsplash.com/photo-1632823471406-4c5c7e4c6f24?w=400&h=300&fit=crop', '00000000-0000-0000-0000-000000000002', 'Complete engine overhaul and performance upgrades.');

-- Seed sample spare parts
INSERT INTO public.spare_parts (name, price, condition, car_model, category, location, rating, seller_id, image_url, description) VALUES
  ('Front Brake Pads Set', 2500, 'New', 'Toyota Corolla 2015-2020', 'Brakes', 'Merkato, Addis Ababa', 4.7, '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'High-quality ceramic brake pads for smooth stopping.'),
  ('Air Filter - Universal', 450, 'New', 'Universal Fit', 'Engine', 'Bole, Addis Ababa', 4.3, '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Universal fit air filter for most car models.'),
  ('Alternator - Reconditioned', 5800, 'Used', 'Hyundai Tucson 2016-2021', 'Electrical', 'Piassa, Addis Ababa', 4.0, '00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Professionally reconditioned alternator, tested and guaranteed.'),
  ('Side Mirror - Left', 1800, 'New', 'Toyota Vitz 2012-2018', 'Body', 'CMC, Addis Ababa', 4.5, '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'OEM quality side mirror replacement.'),
  ('Starter Motor', 7200, 'New', 'Suzuki Swift 2010-2017', 'Engine', 'Gerji, Addis Ababa', 4.8, '00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Brand new starter motor with 1-year warranty.'),
  ('Headlight Assembly - Right', 3400, 'New', 'Toyota Yaris 2014-2020', 'Lighting', 'Summit, Addis Ababa', 4.2, '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Complete headlight assembly with bulb included.'),
  ('Oil Filter Pack (3pc)', 650, 'New', 'Universal Fit', 'Engine', 'Bole, Addis Ababa', 4.6, '00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Pack of 3 premium oil filters.'),
  ('Radiator Fan Motor', 4200, 'Used', 'Toyota Hilux 2012-2018', 'Cooling', 'Merkato, Addis Ababa', 3.9, '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', 'Working radiator fan motor, good condition.');
