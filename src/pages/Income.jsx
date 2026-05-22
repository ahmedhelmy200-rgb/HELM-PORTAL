import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Download, RefreshCw, Search, TrendingUp, WalletCards } from 'lucide-react'
import PageHeader from '../components/helm/PageHeader'
import EmptyState from '../components/helm/EmptyState'
import { loadIncomeTransactions, readLocalIncome, writeLocalIncome } from '@/lib/bankImportHelpers'

function money(n) { return Number(n || 0).toLocaleString('ar-AE', { maximumFractionDigits: 2 }) }
function safeDate(v) { try { const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ar-AE') } catch { return '' } }

export default function Income() {
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const result = await loadIncomeTransactions()
    setRows(Array.isArray(result.items) ? result.items : [])
    setSource(result.source)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => !q || `${r.title} ${r.category} ${r.notes} ${r.bank_reference}`.toLowerCase().includes(q))
  }, [rows, search])

  const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount || 0), 0), [filtered])

  const exportCsv = () => {
    const header = ['date','title','amount','category','source','notes','bank_reference']
    const csv = [header.join(',')].concat(filtered.map((r) => header.map((k) => `"${String(r[k === 'date' ? 'income_date' : k] || '').replace(/"/g, '""')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'helm-income-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLocal = () => {
    if (!confirm('مسح الدخل المحلي فقط؟')) return
    writeLocalIncome([])
    setRows(readLocalIncome())
    setSource('local')
  }

  return (
    <div dir="rtl" className="space-y-5">
      <PageHeader title="الدخل والتحصيلات" subtitle={`${filtered.length} عملية دخل · إجمالي ${money(total)} د.إ`} action={<Button onClick={load} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2 bg-gradient-to-br from-emerald-500/12 to-blue-500/10 border-emerald-400/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-emerald-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الدخل المعروض</p>
              <p className="text-3xl font-black text-foreground">{money(total)} <span className="text-base">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground mb-2">مصدر البيانات</p>
          <Badge className={source === 'supabase' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{source === 'supabase' ? 'قاعدة البيانات' : source === 'loading' ? 'جارٍ الفحص' : 'حفظ محلي'}</Badge>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pr-10" placeholder="بحث في الدخل..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Button onClick={exportCsv} variant="outline" className="gap-2"><Download className="h-4 w-4" /> تصدير CSV</Button>
        {source === 'local' && <Button onClick={clearLocal} variant="outline" className="text-red-600">مسح المحلي</Button>}
      </div>

      {loading ? <div className="h-48 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div> : filtered.length === 0 ? <EmptyState icon={WalletCards} title="لا يوجد دخل مسجل" description="استورد ملف كشف البنك من صفحة استيراد كشف بنك." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r, i) => (
            <Card key={r.id || `${r.bank_reference}-${i}`} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground leading-6">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">📅 {safeDate(r.income_date)} · {r.source || 'تحويل/إيداع'}</p>
                  {r.bank_reference && <p className="text-xs text-muted-foreground mt-1">مرجع: {r.bank_reference}</p>}
                </div>
                <div className="text-left shrink-0"><p className="text-xl font-black text-emerald-600">{money(r.amount)}</p><p className="text-xs text-muted-foreground">د.إ</p></div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap"><Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">{r.category || 'دخل'}</Badge><Badge variant="outline">{r.status || 'محصل'}</Badge></div>
              {r.notes && <p className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 leading-6">{r.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
