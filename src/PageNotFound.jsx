import { useNavigate } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { Home, ArrowRight } from 'lucide-react'

export default function PageNotFound() {
  const navigate = useNavigate()

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-black text-primary/20 select-none">٤٠٤</p>
          <h1 className="text-xl font-bold text-foreground">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            الرابط الذي فتحته غير موجود أو ربما تم نقله.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}
