CREATE POLICY "Anyone can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');