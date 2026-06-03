
-- Create garage_images table for multiple garage photos
CREATE TABLE public.garage_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create spare_part_images table for multiple spare part photos
CREATE TABLE public.spare_part_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for faster lookups
CREATE INDEX idx_garage_images_garage_id ON public.garage_images(garage_id, position);
CREATE INDEX idx_spare_part_images_part_id ON public.spare_part_images(spare_part_id, position);

-- Enable RLS
ALTER TABLE public.garage_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_part_images ENABLE ROW LEVEL SECURITY;

-- garage_images policies
CREATE POLICY "Anyone can view garage images"
  ON public.garage_images FOR SELECT USING (true);

CREATE POLICY "Garage owners can insert images"
  ON public.garage_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.garages
      WHERE id = garage_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Garage owners can delete images"
  ON public.garage_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.garages
      WHERE id = garage_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage garage images"
  ON public.garage_images FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- spare_part_images policies
CREATE POLICY "Anyone can view spare part images"
  ON public.spare_part_images FOR SELECT USING (true);

CREATE POLICY "Sellers can insert spare part images"
  ON public.spare_part_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.spare_parts
      WHERE id = spare_part_id AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete spare part images"
  ON public.spare_part_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.spare_parts
      WHERE id = spare_part_id AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage spare part images"
  ON public.spare_part_images FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
