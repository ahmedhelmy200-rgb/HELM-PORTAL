# HELM Independent App

Open `README_SUPABASE_VERCEL_AR.md` for migration and deployment instructions.

## Stage 3 update

- Added Email/Password login beside Google OAuth.
- Added public legal library available without authentication at `/PublicLegalLibrary`.
- Added password reset page at `/PasswordReset`.
- Run `EMAIL_PASSWORD_AUTH_SETUP.sql` in Supabase and enable Email Provider in Authentication settings.

## Security hardening after Stage 3
Run `FINAL_SECURITY_HARDENING.sql` in Supabase SQL Editor after the prior setup files. This protects `user_profiles`, notification access, and private storage read permissions for client documents.
