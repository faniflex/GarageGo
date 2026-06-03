
-- Add sold column to spare_parts
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS sold boolean NOT NULL DEFAULT false;

-- Add mechanic_status column to garages
ALTER TABLE public.garages ADD COLUMN IF NOT EXISTS mechanic_status text NOT NULL DEFAULT 'available' CHECK (mechanic_status IN ('available', 'busy', 'offline'));

-- Create garage_documents table
CREATE TABLE IF NOT EXISTS public.garage_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  document_url text NOT NULL,
  document_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.garage_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can insert own garage documents"
  ON public.garage_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can view own garage documents"
  ON public.garage_documents FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all garage documents"
  ON public.garage_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update garage documents"
  ON public.garage_documents FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  mechanic_id uuid NOT NULL,
  service_requested text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes text,
  conversation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Mechanics can view orders for their garages"
  ON public.orders FOR SELECT
  USING (auth.uid() = mechanic_id);

CREATE POLICY "Mechanics can update order status"
  ON public.orders FOR UPDATE
  USING (auth.uid() = mechanic_id);

CREATE POLICY "Customers can update own orders (cancel)"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update orders.updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
