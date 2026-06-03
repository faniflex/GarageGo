
-- Conversations table first
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL,
  participant_two uuid NOT NULL,
  garage_id uuid REFERENCES public.garages(id) ON DELETE SET NULL,
  spare_part_id uuid REFERENCES public.spare_parts(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (participant_one, participant_two, garage_id, spare_part_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Now create the security definer function
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
      AND (participant_one = _user_id OR participant_two = _user_id)
  )
$$;

-- Conversation RLS
CREATE POLICY "Participants can view own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Messages RLS
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(auth.uid(), conversation_id)
);

CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin policies on existing tables
CREATE POLICY "Admins can update any garage"
ON public.garages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any garage"
ON public.garages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all spare parts"
ON public.spare_parts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any spare part"
ON public.spare_parts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any spare part"
ON public.spare_parts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
