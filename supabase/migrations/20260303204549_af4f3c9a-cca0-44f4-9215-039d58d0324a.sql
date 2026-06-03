
-- Add online presence columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS online_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Add message type and media to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text;

-- Add verification_level to garages
ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS verification_level integer DEFAULT 0;

-- Add document_type to garage_documents
ALTER TABLE public.garage_documents
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'business_license';

-- Add DELETE policy to conversations for participants
CREATE POLICY "Participants can delete own conversations"
  ON public.conversations
  FOR DELETE
  USING ((auth.uid() = participant_one) OR (auth.uid() = participant_two));

-- Add DELETE policy to messages for conversation participants
CREATE POLICY "Participants can delete messages"
  ON public.messages
  FOR DELETE
  USING (is_conversation_participant(auth.uid(), conversation_id));

-- Add UPDATE policy on garage_documents for owners (re-upload after rejection)
CREATE POLICY "Owners can update own garage documents"
  ON public.garage_documents
  FOR UPDATE
  USING (auth.uid() = owner_id);
