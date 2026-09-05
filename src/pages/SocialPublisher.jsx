import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Facebook, Instagram, Link2, Loader2, Megaphone, RefreshCw, Send, ShieldCheck, Upload } from 'lucide-react'
import PageHeader from '@/components/helm/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/lib/AuthContext'

const OFFICE_PAGE_ID = '1590384108335567'

const statusLabels = {
  draft: 'مسودة',
  scheduled: 'مجدول',
  publishing: 'جارٍ النشر',
  published: 'تم النشر',
  partially_published: 'نشر جزئي',
  failed: 'فشل النشر',
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ar-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function functionError(error, data, fallback) {
  return data?.error || error?.context?.error || error?.message || fallback
}

async function prepareImage(file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('اختر ملف صورة صالحًا.')
  if (file.size > 12 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 12 ميجابايت.')
  if (file.type === 'image/jpeg') return file

  const bitmap = await createImageBitmap(file)
  const maxWidth = 1440
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94))
  if (!blob) throw new Error('تعذر تجهيز الصورة للنشر.')
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}

export default function SocialPublisher() {
  const { user } = useAuth()
  const [connection, setConnection] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [targets, setTargets] = useState({ facebook: true, instagram: true })
  const [instagramPlacement, setInstagramPlacement] = useState('story')
  const [scheduleMode, setScheduleMode] = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [connectionResult, postsResult] = await Promise.all([
        supabase.from('social_connections')
          .select('id, facebook_page_id, facebook_page_name, instagram_business_id, instagram_username, token_expires_at, connected_at, is_active')
          .eq('provider', 'meta').eq('is_active', true).maybeSingle(),
        supabase.from('social_posts').select('*').order('created_at', { ascending: false }).limit(25),
      ])
      if (connectionResult.error) throw connectionResult.error
      if (postsResult.error) throw postsResult.error
      setConnection(connectionResult.data || null)
      setPosts(postsResult.data || [])
    } catch (error) {
      const message = String(error?.message || '')
      if (message.includes('social_connections') || message.includes('social_posts')) {
        alert('يلزم تطبيق Migration رقم 031 على Supabase قبل تشغيل مركز النشر.')
      } else {
        alert(message || 'تعذر تحميل مركز النشر.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const params = new URLSearchParams(window.location.search)
    const result = params.get('meta')
    if (result === 'connected') alert('تم ربط HELM Portal بحساب Meta بنجاح.')
    if (result === 'error') alert(params.get('message') || 'لم يكتمل ربط Meta.')
    if (result) window.history.replaceState({}, document.title, window.location.pathname)
  }, [loadData])

  const connectMeta = async () => {
    setWorking(true)
    try {
      const { data, error } = await supabase.functions.invoke('meta-connect', {
        body: { facebook_page_id: OFFICE_PAGE_ID },
      })
      if (error || data?.error || !data?.authorization_url) {
        throw new Error(functionError(error, data, 'تعذر بدء ربط Meta.'))
      }
      window.location.assign(data.authorization_url)
    } catch (error) {
      alert(error.message || 'تعذر بدء ربط Meta.')
      setWorking(false)
    }
  }

  const handlePublish = async () => {
    if (!caption.trim() && !file) return alert('أضف نصًا أو صورة للمنشور.')
    const selectedTargets = Object.entries(targets).filter(([, enabled]) => enabled).map(([name]) => name)
    if (!selectedTargets.length) return alert('اختر منصة واحدة على الأقل.')
    if (selectedTargets.includes('instagram') && !file) return alert('النشر على Instagram يتطلب صورة.')
    if (scheduleMode === 'scheduled' && !scheduledAt) return alert('حدد تاريخ ووقت النشر.')
    if (!connection) return alert('اربط HELM Portal بحساب Meta أولًا.')

    setWorking(true)
    try {
      let mediaPath = null
      if (file) {
        const readyFile = await prepareImage(file)
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id
        if (!userId) throw new Error('جلسة الدخول غير صالحة.')
        mediaPath = `social/${userId}/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage.from('uploads').upload(mediaPath, readyFile, {
          contentType: 'image/jpeg', cacheControl: '3600', upsert: false,
        })
        if (uploadError) throw uploadError
      }

      const { data, error } = await supabase.functions.invoke('meta-publish', {
        body: {
          caption: caption.trim(),
          media_bucket: mediaPath ? 'uploads' : null,
          media_path: mediaPath,
          targets: selectedTargets,
          instagram_placement: instagramPlacement,
          scheduled_at: scheduleMode === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        },
      })
      if (error || data?.error) throw new Error(functionError(error, data, 'تعذر إرسال المنشور.'))
      alert(data?.scheduled ? 'تمت جدولة المنشور.' : (data?.errors?.length ? `تم النشر جزئيًا:\n${data.errors.join('\n')}` : 'تم النشر بنجاح.'))
      setCaption('')
      setFile(null)
      setScheduledAt('')
      setScheduleMode('now')
      await loadData()
    } catch (error) {
      alert(error.message || 'تعذر النشر.')
    } finally {
      setWorking(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-xl font-black">مركز النشر متاح لمدير النظام فقط</h1>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        title="مركز النشر الاجتماعي"
        subtitle="نشر وجدولة محتوى Ahmed Helmy Legal Consultancy على Facebook وInstagram"
        action={<Button variant="outline" onClick={loadData} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> تحديث</Button>}
      />

      <Card className="overflow-hidden border-amber-300/30 bg-gradient-to-l from-slate-950 to-slate-900 text-white">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-400/15 p-3"><Link2 className="h-7 w-7 text-amber-300" /></div>
            <div>
              <p className="text-lg font-black">{connection ? 'HELM Portal متصل بـ Meta' : 'اربط HELM Portal بـ Meta'}</p>
              <p className="mt-1 text-sm text-slate-300">
                {connection
                  ? `${connection.facebook_page_name || 'صفحة المكتب'}${connection.instagram_username ? ` • @${connection.instagram_username}` : ' • Instagram غير متاح عبر API'}`
                  : 'الربط داخل Business Suite تم؛ يلزم الآن تفويض البوابة بالنشر.'}
              </p>
            </div>
          </div>
          <Button onClick={connectMeta} disabled={working} className="bg-amber-400 font-black text-slate-950 hover:bg-amber-300">
            {working ? <Loader2 className="animate-spin" /> : <Link2 />}
            {connection ? 'إعادة تفويض Meta' : 'ربط حساب Meta'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="text-amber-500" /> إعداد منشور جديد</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="social-caption">نص المنشور</Label>
              <Textarea id="social-caption" rows={7} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="اكتب المعلومة القانونية والمصدر والتنبيه المهني…" />
              <p className="text-xs text-muted-foreground">{caption.length} حرف</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-image">الصورة</Label>
              <label htmlFor="social-image" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-5 font-bold hover:bg-muted">
                <Upload className="h-5 w-5" /> {file ? file.name : 'اختر صورة التصميم'}
              </label>
              <Input id="social-image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <Checkbox checked={targets.facebook} onCheckedChange={(checked) => setTargets((current) => ({ ...current, facebook: checked === true }))} />
                <Facebook className="text-blue-600" /><span className="font-bold">Facebook Page</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <Checkbox checked={targets.instagram} onCheckedChange={(checked) => setTargets((current) => ({ ...current, instagram: checked === true }))} />
                <Instagram className="text-pink-600" /><span className="font-bold">Instagram</span>
              </label>
            </div>

            {targets.instagram && (
              <div className="space-y-2">
                <Label htmlFor="instagram-placement">موضع منشور Instagram</Label>
                <select id="instagram-placement" value={instagramPlacement} onChange={(event) => setInstagramPlacement(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="story">قصة 9:16 — الأنسب لتصاميم المكتب</option>
                  <option value="feed">الصفحة الرئيسية Feed</option>
                </select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <input type="radio" name="schedule" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} />
                <span className="font-bold">نشر الآن</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <input type="radio" name="schedule" checked={scheduleMode === 'scheduled'} onChange={() => setScheduleMode('scheduled')} />
                <span className="font-bold">جدولة</span>
              </label>
            </div>
            {scheduleMode === 'scheduled' && <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />}

            <div className="rounded-xl border border-amber-300/30 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
              انشر صياغة المكتب الأصلية فقط. لا ترفع نص حكم أو صورة من مصدر رسمي إذا كانت شروط الجهة تمنع إعادة النشر.
            </div>

            <Button onClick={handlePublish} disabled={working || loading || !connection} className="h-12 w-full text-base font-black">
              {working ? <Loader2 className="animate-spin" /> : <Send />}
              {scheduleMode === 'scheduled' ? 'حفظ موعد النشر' : 'نشر على المنصات المحددة'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>معاينة 9:16</CardTitle></CardHeader>
            <CardContent>
              <div className="mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl border bg-slate-950">
                {previewUrl
                  ? <img src={previewUrl} alt="معاينة المنشور" className="h-full w-full object-contain" />
                  : <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-400"><Upload className="h-10 w-10" /><span>ستظهر صورة التصميم هنا</span></div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>حالة الاتصال</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>Facebook</span><Badge variant={connection ? 'default' : 'secondary'}>{connection ? 'متصل' : 'غير متصل'}</Badge></div>
              <div className="flex items-center justify-between"><span>Instagram</span><Badge variant={connection?.instagram_business_id ? 'default' : 'secondary'}>{connection?.instagram_business_id ? 'متصل' : 'غير متصل'}</Badge></div>
              {connection?.connected_at && <p className="border-t pt-3 text-xs text-muted-foreground">آخر تفويض: {formatDate(connection.connected_at)}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>سجل النشر</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="animate-spin" /> جارٍ التحميل…</div>
          ) : posts.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">لا توجد منشورات بعد.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="min-w-0"><p className="truncate font-bold">{post.caption || 'منشور بصورة'}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(post.scheduled_at || post.published_at || post.created_at)}</p></div>
                  <div className="flex gap-2">{post.targets?.includes('facebook') && <Facebook className="h-4 w-4 text-blue-600" />}{post.targets?.includes('instagram') && <Instagram className="h-4 w-4 text-pink-600" />}</div>
                  <Badge variant={post.status === 'failed' ? 'destructive' : 'secondary'}>{statusLabels[post.status] || post.status}</Badge>
                  {post.error_message && <p className="text-sm text-red-600 md:col-span-3">{post.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
