# HELM Independent App

Open `README_SUPABASE_VERCEL_AR.md` for migration and deployment instructions.

## Quality gate (بوابة الجودة)

```bash
npm ci            # تثبيت نظيف
npm run lint      # ESLint — يجب أن يمر بلا أخطاء
npm test          # اختبارات الوحدة (Vitest)
npm run build     # بناء الإنتاج
npm run verify    # الثلاثة معًا — نفّذها قبل أي نشر
```

تُشغَّل نفس الخطوات آليًا في `.github/workflows/ci.yml` على كل طلب دمج وعند الدفع إلى `main`.

## المراجعة الشاملة وخطة التطوير

راجع `docs/REVIEW_2026-09_AR.md` — مراجعة كاملة للمنصة (الأمان، الأداء، المعمارية،
قاعدة البيانات، SEO) مع قائمة النتائج حسب الخطورة وخطة تطوير على أربع مراحل.

## Stage 3 update

- Added Email/Password login beside Google OAuth.
- Added public legal library available without authentication at `/PublicLegalLibrary`.
- Added password reset page at `/PasswordReset`.
- Run `EMAIL_PASSWORD_AUTH_SETUP.sql` in Supabase and enable Email Provider in Authentication settings.

## Security hardening after Stage 3
Run `FINAL_SECURITY_HARDENING.sql` in Supabase SQL Editor after the prior setup files. This protects `user_profiles`, notification access, and private storage read permissions for client documents.

## Meta social publishing

The admin-only Facebook/Instagram publishing center is documented in `docs/META_SOCIAL_PUBLISHING_SETUP_AR.md`.
