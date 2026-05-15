# HELM Portal — Phase 2 Security Notes

## What changed

This phase updates the client data layer without breaking old data.

### 1. Client data scoping

The app now prefers stable client scoping by `client_id` for:

- cases
- invoices
- documents
- sessions
- tasks

It keeps `client_name` as a temporary fallback for old rows.

### 2. Client uploads

Client-created documents now include:

- `client_id`
- `client_name`
- `created_by`

If the current Supabase schema does not yet have `client_id`, the app falls back to the old payload automatically.

### 3. Storage bucket creation

The frontend no longer tries to create Supabase Storage buckets or policies from the browser.

Storage must be prepared from Supabase SQL/Admin using:

```sql
supabase/migrations/010_portal_security_client_id_rls.sql
```

### 4. Required environment variables

The app requires:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

If they are missing, `SupabaseConfigGate` blocks the app with a clear setup screen.

## Required manual step

Open Supabase SQL Editor and run:

```sql
supabase/migrations/010_portal_security_client_id_rls.sql
```

Then verify:

- bucket `uploads` exists
- RLS policies were created
- clients table has `user_id` and `email`
- cases/documents/invoices/sessions/tasks have `client_id`

## Next phase

- convert pages to use pagination by default
- audit tables for missing columns
- add build/test GitHub Action
- prepare Edge Function for AI/OCR instead of exposing AI keys to Vite
