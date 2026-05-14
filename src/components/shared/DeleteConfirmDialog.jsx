import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

/**
 * مكوّن تأكيد الحذف — بديل موحّد لـ confirm() النظامي.
 */
export default function DeleteConfirmDialog({
  open,
  itemName = 'هذا السجل',
  description,
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel?.() }}>
      <AlertDialogContent dir="rtl" className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-right leading-snug">
              تأكيد الحذف
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-right leading-relaxed">
            {description || (
              <>
                هل أنت متأكد من حذف{' '}
                <span className="font-semibold text-foreground">&quot;{itemName}&quot;</span>؟
                <br />
                <span className="text-destructive/80">لا يمكن التراجع عن هذا الإجراء.</span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'جارٍ الحذف…' : 'حذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
