
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('car_owner', 'mechanic', 'seller', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create garages table
CREATE TABLE public.garages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  services TEXT[] DEFAULT '{}',
  image_url TEXT,
  verified BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view garages" ON public.garages FOR SELECT USING (true);
CREATE POLICY "Mechanics can insert own garage" ON public.garages FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mechanics can update own garage" ON public.garages FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Mechanics can delete own garage" ON public.garages FOR DELETE USING (auth.uid() = owner_id);

-- Create spare_parts table
CREATE TABLE public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  condition TEXT NOT NULL DEFAULT 'New' CHECK (condition IN ('New', 'Used')),
  car_model TEXT,
  category TEXT,
  image_url TEXT,
  location TEXT,
  available BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available parts" ON public.spare_parts FOR SELECT USING (available = true);
CREATE POLICY "Sellers can insert own parts" ON public.spare_parts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own parts" ON public.spare_parts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own parts" ON public.spare_parts FOR DELETE USING (auth.uid() = seller_id);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  garage_id UUID REFERENCES public.garages(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (garage_id IS NOT NULL AND spare_part_id IS NULL) OR
    (garage_id IS NULL AND spare_part_id IS NOT NULL)
  )
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_garages_updated_at BEFORE UPDATE ON public.garages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON public.spare_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'car_owner'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
