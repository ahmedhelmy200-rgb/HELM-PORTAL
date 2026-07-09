import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UploadCloud, CheckCircle2, FileJson, Landmark, RefreshCw, DatabaseZap } from 'lucide-react'
import PageHeader from '../components/helm/PageHeader'
import { bankImportSummary, importExpensesToPortal, importIncomeToPortal, readJsonFile } from '@/lib/bankImportHelpers'
import { adibMemoryBankData } from '@/lib/adibMemoryBankData'

function money(n) { return Number(n || 0).toLocaleString('ar-AE', { maximumFractionDigits: 2 }) }

export default function BankImport() {
  const [data, setData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const summary = useMemo(() => bankImportSummary(data || {}), [data])

  const pickFile = async (file) => {
    setError(''); setMessage('')
    if (!file) return
    setFileName(file.name)
    try {
      const parsed = await readJsonFile(file)
      setData(parsed)
      const s = bankImportSummary(parsed)
      setMessage(`تم قراءة الملف: ${s.expenses.length} مصروف و ${s.income.length} دخل و ${s.review.length} للمراجعة.`)
    } catch (err) {
      setData(null)
      setError(err?.message || 'تعذر قراءة الملف.')
    }
  }

  const loadMemoryData = () => {
    setError('')
    setData(adibMemoryBankData)
    setFileName('ADIB memory summary 2026-01-01 to 2026-05-01')
    const s = bankImportSummary(adibMemoryBankData)
    setMessage(`تم تحميل ملخص ADIB من الذاكرة: ${s.expenses.length} صف مصروفات ملخص بإجمالي ${money(s.expenseTotal)} د.إ، و${s.income.length} صف دخل بإجمالي ${money(s.incomeTotal)} د.إ. هذا ملخص تصنيفي وليس 296 عملية تفصيلية.`)
  }

  const importAll = async () => {
    if (!data) return
    setBusy(true); setError(''); setMessage('')
    try {
      const [expensesResult, incomeResult] = await Promise.all([
        importExpensesToPortal(summary.expenses),
        importIncomeToPortal(summary.income),
      ])
      setMessage(`تم إدخال ${expensesResult.imported} مصروف في ${expensesResult.source === 'supabase' ? 'قاعدة البيانات' : 'الحفظ المحلي'}، وتم إدخال ${incomeResult.imported} دخل في ${incomeResult.source === 'supabase' ? 'قاعدة البيانات' : 'الحفظ المحلي'}.`)
    } catch (err) {
      setError(err?.message || 'تعذر الإدخال.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div dir="rtl" className="space-y-5">
      <PageHeader title="استيراد كشف بنك" subtitle="إدخال المصاريف والدخل من ملف JSON أو من ملخص ADIB المحفوظ" action={<Badge className="bg-blue-100 text-blue-800">ADIB / HELM</Badge>} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5 border-dashed border-2">
          <label className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-muted/25 p-8 cursor-pointer hover:bg-muted/40 transition">
            <UploadCloud className="h-10 w-10 text-primary" />
            <div className="text-center">
              <p className="font-black text-foreground">ارفع ملف JSON الجاهز للاستيراد</p>
              <p className="text-xs text-muted-foreground mt-1">استخدم ملف HELM_Bank_Import_Data.json إذا كان متوفرًا لديك.</p>
            </div>
            <Input type="file" accept=".json,application/json" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            <span className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white">اختيار الملف</span>
          </label>
          {fileName && <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1"><FileJson className="h-3.5 w-3.5" /> {fileName}</p>}
        </Card>

        <Card className="p-5 border-primary/10 bg-primary/5 flex flex-col justify-center gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><DatabaseZap className="h-5 w-5" /></div>
            <div>
              <h3 className="font-black text-foreground">استيراد ملخص ADIB المحفوظ</h3>
              <p className="text-sm text-muted-foreground leading-7 mt-1">الفترة 2026-01-01 إلى 2026-05-01: 296 عملية في الأصل، محفوظ هنا كملخص تصنيفي: 252 مصروف، 27 دخل، 17 مراجعة.</p>
            </div>
          </div>
          <Button type="button" onClick={loadMemoryData} variant="outline" className="gap-2 h-11"><DatabaseZap className="h-4 w-4" />تحميل ملخص ADIB من الذاكرة</Button>
        </Card>
      </div>

      {error && <Card className="p-4 border-red-200 bg-red-50 text-red-800 text-sm font-bold">{error}</Card>}
      {message && <Card className="p-4 border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {message}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat title="المصاريف" value={summary.expenses.length} amount={summary.expenseTotal} tone="red" />
        <Stat title="الدخل" value={summary.income.length} amount={summary.incomeTotal} tone="emerald" />
        <Stat title="للمراجعة" value={summary.review.length} amount={0} tone="amber" />
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div><p className="text-xs text-muted-foreground">الصافي</p><p className={`text-2xl font-black ${summary.incomeTotal - summary.expenseTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{money(summary.incomeTotal - summary.expenseTotal)} د.إ</p></div>
          <Button disabled={!data || busy} onClick={importAll} className="gap-2 bg-primary text-white"><Landmark className="h-4 w-4" /> {busy ? 'جارٍ الإدخال...' : 'إدخال في النظام'}</Button>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-black text-foreground mb-3">طريقة العمل</h3>
        <div className="space-y-2 text-sm text-muted-foreground leading-7">
          <p>1. المصاريف تدخل في قسم المصاريف مباشرة.</p>
          <p>2. الدخل يدخل في صفحة الدخل والتحصيلات.</p>
          <p>3. ملف JSON التفصيلي هو الأفضل لأنه يحفظ كل عملية وحدها؛ زر ملخص ADIB يحفظ المجاميع المعروفة فقط.</p>
          <p>4. إذا كانت قاعدة البيانات غير مجهزة، يتم الحفظ محلياً داخل المتصفح حتى لا تضيع البيانات.</p>
        </div>
      </Card>

      {busy && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"><Card className="p-6 flex items-center gap-3"><RefreshCw className="h-5 w-5 animate-spin" /> جارٍ إدخال البيانات...</Card></div>}
    </div>
  )
}

function Stat({ title, value, amount, tone }) {
  const cls = tone === 'red' ? 'text-red-600 bg-red-50' : tone === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
  return <Card className="p-4"><p className="text-xs text-muted-foreground">{title}</p><p className={`mt-1 text-2xl font-black ${cls.split(' ')[0]}`}>{value}</p>{amount > 0 && <p className="mt-1 text-sm font-bold text-foreground">{money(amount)} د.إ</p>}</Card>
}
