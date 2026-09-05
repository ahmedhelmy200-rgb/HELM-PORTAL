# ربط HELM Portal مع Facebook وInstagram

هذه الإضافة تنشر من الخادم فقط. لا تُخزَّن كلمة مرور Facebook أو Instagram، ولا يظهر رمز وصول Meta في المتصفح أو في مستودع GitHub.

## ما تم بناؤه

- شاشة إدارية باسم **مركز النشر**.
- نشر فوري على صفحة Facebook.
- نشر صورة على Instagram كقصة 9:16 أو كمنشور Feed.
- جدولة منشورات مع سجل للحالة والأخطاء.
- تخزين رمز الصفحة في جدول لا يستطيع مستخدمو المتصفح قراءته.
- استخدام صور Supabase الخاصة عبر رابط مؤقت يُنشأ وقت النشر.

## 1. تطبيق قاعدة البيانات

شغّل الملف التالي على مشروع Supabase المرتبط بـ HELM Portal:

`supabase/migrations/031_meta_social_publishing.sql`

## 2. إنشاء تطبيق Meta

من حساب Meta الذي يملك تحكمًا كاملًا بصفحة المكتب، أنشئ تطبيقًا من نوع Business وأضف إعداد Facebook Login for Business وInstagram API.

أضف رابط إعادة التوجيه التالي حرفيًا:

`https://ohbfzwarfznbgszuvfxv.supabase.co/functions/v1/meta-oauth-callback`

الصلاحيات التي تطلبها البوابة:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

صفحة المكتب المعتمدة:

- Facebook Page ID: `1590384108335567`
- Page URL: `https://www.facebook.com/HELMYLAW200/`

## 3. ضبط Supabase Secrets

اضبط القيم التالية داخل Supabase Edge Functions Secrets. لا تضعها في `.env` الخاص بواجهة Vite ولا في GitHub:

```text
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI=https://ohbfzwarfznbgszuvfxv.supabase.co/functions/v1/meta-oauth-callback
META_PAGE_ID=1590384108335567
META_GRAPH_VERSION=v26.0
HELM_PUBLIC_SITE_URL=https://helm-protal.vercel.app
META_CRON_SECRET=<قيمة عشوائية طويلة>
```

`META_LOGIN_CONFIG_ID` اختياري إذا أنشأت إعداد Facebook Login for Business مخصصًا. ويمكن إضافة صلاحيات أخرى في `META_EXTRA_SCOPES` مفصولة بفواصل.

## 4. نشر Edge Functions

انشر الوظائف التالية:

```text
meta-connect
meta-oauth-callback
meta-publish
meta-process-queue
```

الملف `supabase/config.toml` يعطّل التحقق التلقائي من JWT لوظيفة callback ووظيفة الجدولة فقط. وظيفة callback محمية بحالة OAuth أحادية الاستخدام، ووظيفة الجدولة محمية بترويسة `x-cron-secret`.

## 5. تشغيل الجدولة

من Supabase Cron أنشئ طلب POST كل خمس دقائق إلى:

`https://ohbfzwarfznbgszuvfxv.supabase.co/functions/v1/meta-process-queue`

مع الترويسة:

`x-cron-secret: <نفس قيمة META_CRON_SECRET>`

احفظ السر في Supabase Vault/Secrets ولا تضعه في ملف SQL أو GitHub.

## 6. التفويض الأول

بعد النشر:

1. سجل الدخول إلى HELM Portal بحساب المدير.
2. افتح **مركز النشر**.
3. اضغط **ربط حساب Meta**.
4. وافق على صفحة **Ahmed Helmy Legal Consultancy** وحساب Instagram المرتبط بها.
5. نفّذ منشور اختبار خاص بالمكتب، ثم راجع سجل النشر.

## قيود مهمة

- يجب أن يكون Instagram حسابًا احترافيًا ومربوطًا بصفحة Facebook.
- قصة Instagram لا تنشر وصفًا نصيًا مستقلًا؛ النص يجب أن يكون داخل تصميم 9:16 نفسه.
- صلاحيات النشر قد تحتاج Advanced Access ومراجعة تطبيق Meta قبل استخدامها مع حسابات ليست ضمن أدوار التطبيق.
- لا تستخدم صور الأحكام أو النصوص المنشورة رسميًا إذا كانت شروط الجهة القضائية تمنع إعادة نشرها؛ استخدم صياغة قانونية أصلية للمكتب مع رابط المصدر عند السماح.
