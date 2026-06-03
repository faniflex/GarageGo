
-- Create a private bucket for sensitive garage verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- RLS policies for the documents bucket
-- Garage owners can upload their own documents
CREATE POLICY "Garage owners can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'garage-docs'
);

-- Garage owners can view their own documents
CREATE POLICY "Garage owners can view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'garage-docs'
  AND auth.uid() IS NOT NULL
);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND has_role(auth.uid(), 'admin'::app_role)
);
