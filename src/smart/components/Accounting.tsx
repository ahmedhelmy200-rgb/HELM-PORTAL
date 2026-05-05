
import React, { useState, useMemo } from 'react';
import { Invoice, LegalCase, Client, Expense, ExpenseCategory, FutureDebt, SystemSettings } from '../types';
import { COLORS } from '../constants';

interface AccountingProps {
  invoices: Invoice[];
  expenses: Expense[];
  futureDebts: FutureDebt[];
  clients: Client[];
  cases: LegalCase[];
  onAddExpense: (exp: Expense) => void;
  onAddFutureDebt: (debt: FutureDebt) => void;
  onAddInvoice: (inv: Invoice) => void; // Made mandatory
  onUpdateInvoice: (inv: Invoice) => void; // Made mandatory
  onBack: () => void;
  settings: SystemSettings; // Add settings prop
}

interface PrintInvoiceModalProps {
  invoice: Invoice;
  client: Client;
  cases: LegalCase[];
  settings: SystemSettings;
  onClose: () => void;
}

const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ invoice, client, settings, onClose, cases }) => {
  const { logo, stamp, signature, primaryColor } = settings;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print-container"> {/* Changed to print-container */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-200 overflow-auto"> {/* This div is visible on screen */}
        
        {/* Print Content Wrapper */}
        <div className="printable-content"> {/* This content gets styled specifically for print */}

          <div className="flex justify-between items-center pb-6 mb-6 border-b-2" style={{ borderColor: primaryColor }}>
            <div className="flex items-center gap-4">
              {logo && <img src={logo} alt="Office Logo" className="h-20 w-auto object-contain" />}
              <div>
                <h2 className="text-2xl font-black text-slate-800">مكتب المستشار أحمد حلمي</h2>
                <p className="text-slate-500 text-sm mt-1">للمحاماة والاستشارات القانونية</p>
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-slate-800" style={{ color: primaryColor }}>فاتورة ضريبية</h3>
              <p className="text-slate-500 text-sm mt-1">رقم الفاتورة: {invoice.id}</p>
              <p className="text-slate-500 text-sm">تاريخ الفاتورة: {invoice.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-black text-slate-500 uppercase mb-2">فاتورة إلى:</h4>
              <p className="text-lg font-bold text-slate-800">{client.name}</p>
              <p className="text-slate-600 text-sm">{client.address}</p>
              <p className="text-slate-600 text-sm">{client.phone}</p>
              <p className="text-slate-600 text-sm">{client.email}</p>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-500 uppercase mb-2">تفاصيل الفاتورة:</h4>
              <p className="text-slate-600 text-sm">القضية المرتبطة: {invoice.caseId ? (cases.find(c => c.id === invoice.caseId)?.title || 'غير محدد') : 'لا يوجد'}</p>
              <p className="text-slate-600 text-sm">الوصف: {invoice.description || 'أتعاب قانونية عامة'}</p>
              <p className="text-slate-600 text-sm">الحالة: <span className={`font-bold ${invoice.status === 'Paid' ? 'text-green-600' : invoice.status === 'Partially Paid' ? 'text-amber-600' : 'text-red-600'}`}>{invoice.status === 'Paid' ? 'مدفوعة' : invoice.status === 'Partially Paid' ? 'مدفوعة جزئياً' : 'مستحقة'}</span></p>
            </div>
          </div>

          <table className="w-full text-right mb-10 border border-slate-200">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">الوصف</th>
                <th className="p-4">المبلغ المستحق</th>
                <th className="p-4">المبلغ المدفوع</th>
                <th className="p-4">المبلغ المتبقي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-4 text-sm text-slate-700">{invoice.description || 'أتعاب قانونية'}</td>
                <td className="p-4 text-sm font-bold text-slate-800">{invoice.amount.toLocaleString()} د.إ</td>
                <td className="p-4 text-sm font-bold text-green-600">{(invoice.paidAmount || 0).toLocaleString()} د.إ</td>
                <td className="p-4 text-sm font-bold text-red-600">{(invoice.amount - (invoice.paidAmount || 0)).toLocaleString()} د.إ</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-200 relative">
            <div>
              <h4 className="text-sm font-black text-slate-500 uppercase mb-2">إجمالي الفاتورة:</h4>
              <p className="text-3xl font-black text-slate-800" style={{ color: primaryColor }}>{invoice.amount.toLocaleString()} د.إ</p>
            </div>
            <div className="text-center">
              {signature && <img src={signature} alt="Signature" className="h-20 w-auto mx-auto mb-2 object-contain" />}
              <p className="text-slate-700 font-bold text-sm">المستشار أحمد حلمي</p>
              <p className="text-slate-500 text-xs">المدير العام</p>
            </div>
            {stamp && <img src={stamp} alt="Stamp" className="absolute bottom-0 right-0 h-32 w-32 object-contain opacity-50 -rotate-12" />}
          </div>
        </div> {/* End printable-content */}

        <div className="no-print absolute top-4 left-4">
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="no-print mt-6 text-center">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg hover:bg-blue-600 transition-all">طباعة الفاتورة</button>
        </div>
      </div>
    </div>
  );
};

export default function Accounting({ invoices, expenses, futureDebts, clients, cases, onAddExpense, onAddFutureDebt, onAddInvoice, onUpdateInvoice, onBack, settings }: AccountingProps) {
  const { primaryColor } = settings;
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'invoices' | 'expenses' | 'debts' | 'reports'>('overview');
  
  // Modal States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintInvoiceModal, setShowPrintInvoiceModal] = useState(false); // New state for print modal
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Form States
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({ amount: 0, paidAmount: 0, status: 'Unpaid', date: new Date().toLocaleDateString('en-CA') });
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ amount: 0, category: ExpenseCategory.OFFICE, date: new Date().toLocaleDateString('en-CA') });
  const [newDebt, setNewDebt] = useState<Partial<FutureDebt>>({ amount: 0, dueDate: new Date().toLocaleDateString('en-CA') });

  const [invoiceFormError, setInvoiceFormError] = useState<string | null>(null); // New state for form errors

  // Stats Calculation
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingRevenue = invoices.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
    const officeExpenses = expenses.filter(e => e.category === ExpenseCategory.OFFICE || e.category === ExpenseCategory.GENERAL_OPERATIONAL).reduce((s, e) => s + e.amount, 0);
    const personalExpenses = expenses.filter(e => e.category === ExpenseCategory.PERSONAL).reduce((s, e) => s + e.amount, 0);
    const caseRelatedExpenses = expenses.filter(e => e.category === ExpenseCategory.CASE_RELATED).reduce((s, e) => s + e.amount, 0);
    const futureCollections = futureDebts.reduce((s, d) => s + d.amount, 0);
    
    return { 
      totalRevenue, 
      pendingRevenue, 
      officeExpenses, 
      personalExpenses, 
      caseRelatedExpenses,
      futureCollections, 
      netProfit: totalRevenue - officeExpenses - personalExpenses - caseRelatedExpenses
    };
  }, [invoices, expenses, futureDebts]);

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceFormError(null); // Clear previous errors

    if (!newInvoice.clientId) {
      setInvoiceFormError('الرجاء اختيار موكل.');
      return;
    }
    if (newInvoice.amount === undefined || newInvoice.amount <= 0) {
      setInvoiceFormError('الرجاء إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }
    
    const inv: Invoice = {
        id: Math.random().toString(36).substr(2, 9),
        clientId: newInvoice.clientId,
        caseId: newInvoice.caseId || undefined,
        amount: Number(newInvoice.amount),
        paidAmount: 0,
        status: 'Unpaid',
        date: newInvoice.date || new Date().toLocaleDateString('ar-AE'),
        description: newInvoice.description || 'فاتورة عامة',
        branch: newInvoice.branch || 'الرئيسي'
    };
    onAddInvoice(inv);
    setShowInvoiceModal(false);
    setNewInvoice({ amount: 0, paidAmount: 0, status: 'Unpaid', date: new Date().toLocaleDateString('en-CA') });
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.amount && newExpense.description) {
        const exp: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            amount: Number(newExpense.amount),
            category: newExpense.category || ExpenseCategory.OFFICE,
            description: newExpense.description,
            date: newExpense.date || new Date().toLocaleDateString('ar-AE'),
            caseId: newExpense.caseId || undefined,
            branch: newExpense.branch || 'الرئيسي'
        };
        onAddExpense(exp);
        setShowExpenseModal(false);
        setNewExpense({ amount: 0, category: ExpenseCategory.OFFICE, date: new Date().toLocaleDateString('en-CA'), description: '' });
    }
  };

  const handleSubmitDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDebt.clientName && newDebt.amount) {
        const debt: FutureDebt = {
            id: Math.random().toString(36).substr(2, 9),
            clientName: newDebt.clientName,
            clientId: newDebt.clientId || undefined,
            amount: Number(newDebt.amount),
            dueDate: newDebt.dueDate || new Date().toLocaleDateString('ar-AE'),
            description: newDebt.description || '',
            isReminded: false
        };
        onAddFutureDebt(debt);
        setShowDebtModal(false);
        setNewDebt({ amount: 0, dueDate: new Date().toLocaleDateString('en-CA'), clientName: '', description: '' });
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !onUpdateInvoice) return;

    const amountToAdd = parseFloat(paymentAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert('الرجاء إدخال مبلغ صحيح وموجب.');
      return;
    }

    const currentPaid = selectedInvoice.paidAmount || 0;
    const remaining = selectedInvoice.amount - currentPaid;

    if (amountToAdd > remaining) {
      alert('المبلغ المدخل أكبر من المبلغ المتبقي!');
      return;
    }

    const newPaidAmount = currentPaid + amountToAdd;
    let newStatus: Invoice['status'] = selectedInvoice.status;
    if (newPaidAmount >= selectedInvoice.amount) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partially Paid';
    }

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      paidAmount: newPaidAmount,
      status: newStatus
    };

    onUpdateInvoice(updatedInvoice);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setSelectedInvoice(null);
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all shadow-sm text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </button>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">الإدارة المالية المركزية</h2>
              {/* [FIX]: Changed text color for better contrast on light background */}
              <p className="font-bold text-sm text-slate-800">كافة التدفقات النقدية والمصاريف والديون</p>
           </div>
        </div>
        
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
           {(['overview', 'invoices', 'expenses', 'debts'] as const).map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveSubTab(tab)} 
               className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all duration-300 ${activeSubTab === tab ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
               style={activeSubTab === tab ? { backgroundColor: primaryColor, color: 'white' } : {}}
             >
                {tab === 'overview' ? 'لوحة الأداء' : tab === 'invoices' ? 'الفواتير والإيصالات' : tab === 'expenses' ? 'سجل المصاريف' : 'الديون المستقبلية'}
             </button>
           ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">إجمالي المحصل</p>
                 <h3 className="text-4xl font-black text-green-600">{stats.totalRevenue.toLocaleString()} <span className="text-xs text-green-500/50">د.إ</span></h3>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">مصاريف التشغيل</p>
                 <h3 className="text-4xl font-black text-red-500">{stats.officeExpenses.toLocaleString()} <span className="text-xs text-red-500/50">د.إ</span></h3>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">مستحقات (متبقي)</p>
                 <h3 className="text-4xl font-black text-amber-500">{stats.pendingRevenue.toLocaleString()} <span className="text-xs text-amber-500/50">د.إ</span></h3>
              </div>
              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl shadow-slate-300 group hover:-translate-y-1 transition-all border border-slate-700" style={{ backgroundColor: primaryColor }}>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">صافي الأرباح</p>
                 <h3 className="text-4xl font-black text-white">{stats.netProfit.toLocaleString()} <span className="text-xs text-white/50">د.إ</span></h3>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                 <h4 className="font-black text-xl mb-8 flex justify-between items-center text-slate-800">
                    آخر الإيرادات
                    {/* [FIX]: Changed text color for better contrast on light background */}
                    <button onClick={() => setActiveSubTab('invoices')} className="text-xs underline text-slate-800 hover:text-blue-600">عرض الكل</button>
                 </h4>
                 <div className="space-y-4">
                    {invoices.slice(0, 5).map(inv => (
                       <div key={inv.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:bg-white transition-all group">
                          <div>
                             <p className="font-black text-sm text-slate-800">{clients.find(c => c.id === inv.clientId)?.name || 'موكل عام'}</p>
                             <p className="text-[10px] text-slate-500 mt-1 font-bold">{inv.date}</p>
                          </div>
                          <div className="text-left">
                             <p className="font-black text-sm text-slate-800">{(inv.paidAmount || 0).toLocaleString()} <span className="text-[10px] text-slate-500">/ {inv.amount.toLocaleString()}</span></p>
                             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                               inv.status === 'Paid' ? 'bg-green-50 text-green-700' : 
                               inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' : 
                               'bg-red-50 text-red-700'
                             }`}>
                                {inv.status === 'Paid' ? 'خالص' : inv.status === 'Partially Paid' ? 'دفع جزئي' : 'معلق'}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                 <h4 className="font-black text-xl mb-8 text-slate-800">إحصائيات المصاريف</h4>
                 <div className="h-64 flex items-end justify-around gap-6 px-6 border-b border-slate-200">
                    <div className="flex-1 bg-blue-100 rounded-t-3xl transition-all hover:bg-blue-200 relative group border border-blue-200 border-b-0" style={{ height: `${(stats.officeExpenses / (stats.officeExpenses + stats.personalExpenses + stats.caseRelatedExpenses)) * 100 || 0}%` }}>
                       <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">مكتب وت. عام</span>
                    </div>
                    <div className="flex-1 bg-amber-100 rounded-t-3xl transition-all hover:bg-amber-200 relative group border border-amber-200 border-b-0" style={{ height: `${(stats.personalExpenses / (stats.officeExpenses + stats.personalExpenses + stats.caseRelatedExpenses)) * 100 || 0}%` }}>
                       <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">شخصية</span>
                    </div>
                    <div className="flex-1 bg-purple-100 rounded-t-3xl transition-all hover:bg-purple-200 relative group border border-purple-200 border-b-0" style={{ height: `${(stats.caseRelatedExpenses / (stats.officeExpenses + stats.personalExpenses + stats.caseRelatedExpenses)) * 100 || 0}%` }}>
                       <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">خاصة بقضية</span>
                    </div>
                 </div>
                 <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                       <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">مكتبي</p>
                       <p className="font-black text-blue-600 text-lg">{stats.officeExpenses.toLocaleString()} <span className="text-xs">د.إ</span></p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                       <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">شخصي</p>
                       <p className="font-black text-amber-700 text-lg">{stats.personalExpenses.toLocaleString()} <span className="text-xs">د.إ</span></p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                       <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">القضايا</p>
                       <p className="font-black text-purple-700 text-lg">{stats.caseRelatedExpenses.toLocaleString()} <span className="text-xs">د.إ</span></p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                 <h4 className="font-black text-2xl text-slate-800">سجل الفواتير والإيصالات</h4>
                 <p className="text-slate-500 text-xs mt-1 font-bold">إدارة كافة المطالبات المالية والمبالغ المحصلة</p>
              </div>
              <div className="flex gap-4">
                 {/* <button className="bg-slate-100 border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-slate-200 shadow-sm transition-all">تحميل كشف مالي (Excel)</button> */}
                 <button onClick={() => { setShowInvoiceModal(true); setInvoiceFormError(null); }} className="text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-blue-600 shadow-lg transition-all" style={{ backgroundColor: primaryColor }}>+ فاتورة جديدة</button>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-right min-w-[800px]">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                   <tr>
                      <th className="p-6">الموكل والقضية</th>
                      <th className="p-6">المبلغ (مدفوع / كلي)</th>
                      <th className="p-6">الحالة</th>
                      <th className="p-6">التاريخ</th>
                      <th className="p-6 text-center">الإجراءات</th> {/* Changed to الإجراءات for print button */}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {invoices.map(inv => {
                      const client = clients.find(c => c.id === inv.clientId);
                      return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-all group">
                         <td className="p-6">
                            <div className="flex items-center gap-4">
                               {/* [FIX]: Changed text color for better contrast on light background */}
                               <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 font-black" style={{ color: primaryColor }}>
                                  {client?.name.charAt(0) || '?'}
                               </div>
                               <div>
                                  <p className="font-black text-sm text-slate-800">{client?.name || 'غير معروف'}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold truncate max-w-[150px]">{inv.description || 'فاتورة عامة'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                           <div className="flex flex-col">
                             <span className="font-black text-slate-800 text-base">{(inv.paidAmount || 0).toLocaleString()} <span className="text-[10px] text-slate-500">د.إ</span></span>
                             <span className="text-[9px] text-slate-500 font-bold mt-0.5">من أصل {inv.amount.toLocaleString()}</span>
                           </div>
                         </td>
                         <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                                inv.status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                               {inv.status === 'Paid' ? 'تم التحصيل' : inv.status === 'Partially Paid' ? 'دفع جزئي' : 'غير مدفوع'}
                            </span>
                         </td>
                         <td className="p-6 text-slate-500 text-xs font-bold">{inv.date}</td>
                         <td className="p-6 text-center flex items-center justify-center gap-2">
                            {inv.status !== 'Paid' && (
                               <button 
                                 onClick={() => { setSelectedInvoice(inv); setPaymentAmount(''); setShowPaymentModal(true); }}
                                 className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm text-slate-500"
                                 title="تسجيل دفعة مالية"
                               >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                               </button>
                            )}
                            <button 
                              onClick={() => { 
                                const clientForInvoice = clients.find(c => c.id === inv.clientId);
                                if (clientForInvoice) {
                                  setSelectedInvoice(inv); 
                                  setShowPrintInvoiceModal(true); 
                                } else {
                                  alert('لا يمكن طباعة الفاتورة بدون معلومات موكل صالح.');
                                }
                              }}
                              className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm text-slate-500"
                              title="طباعة الفاتورة"
                            >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0l-4 4m4-4l4 4m-4-4v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg>
                            </button>
                         </td>
                      </tr>
                   )})}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
              <h4 className="font-black text-2xl text-slate-800">سجل المصروفات التشغيلية</h4>
              <button onClick={() => setShowExpenseModal(true)} className="text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all" style={{ backgroundColor: primaryColor }}>+ إضافة مصروف جديد</button>
           </div>
           <table className="w-full text-right">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                 <tr>
                    <th className="p-6">التصنيف</th>
                    <th className="p-6">البيان / الوصف</th>
                    <th className="p-6">ربط بالقضية</th>
                    <th className="p-6">القيمة</th>
                    <th className="p-6">التاريخ</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-all">
                       <td className="p-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                            e.category === ExpenseCategory.PERSONAL ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                            e.category === ExpenseCategory.CASE_RELATED ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                             {e.category === ExpenseCategory.PERSONAL ? 'شخصي' : e.category === ExpenseCategory.CASE_RELATED ? 'خاص بقضية' : 'مكتبي/تشغيلي'}
                          </span>
                       </td>
                       <td className="p-6 font-bold text-slate-700 text-sm">{e.description}</td>
                       <td className="p-6 text-slate-500 text-sm">{e.caseId ? cases.find(c => c.id === e.caseId)?.title : '-'}</td>
                       <td className="p-6 font-black text-red-500 text-sm">{e.amount.toLocaleString()} د.إ</td>
                       <td className="p-6 text-slate-500 text-xs font-bold">{e.date}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {activeSubTab === 'debts' && (
        <div className="space-y-8 p-4">
           <div className="flex justify-end">
              <button onClick={() => setShowDebtModal(true)} className="text-white px-8 py-3.5 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg" style={{ backgroundColor: primaryColor }}>+ تسجيل دين خارجي جديد</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {futureDebts.map(debt => (
               <div key={debt.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-all group">
                <div className="absolute top-0 right-0 w-1.5 h-full" style={{ backgroundColor: primaryColor }}></div>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-amber-100 rounded-2xl text-amber-700 border border-amber-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div className="text-left">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">تاريخ الاستحقاق</p>
                      <p className="font-black text-slate-700 text-xs">{debt.dueDate}</p>
                   </div>
                </div>
                <h5 className="font-black text-xl text-slate-800 mb-2">{debt.clientName}</h5>
                <p className="text-xs text-slate-500 mb-8 leading-relaxed font-medium">{debt.description}</p>
                <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                   <div>
                      <p className="text-[9px] font-black text-slate-500 mb-0.5">المبلغ المنتظر</p>
                      <p className="text-2xl font-black text-slate-800">{debt.amount.toLocaleString()} <span className="text-xs text-slate-500">د.إ</span></p>
                   </div>
                   {/* Reminder Button Placeholder */}
                   <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   </button>
                </div>
             </div>
           ))}
           {futureDebts.length === 0 && (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                <p className="text-slate-500 font-bold text-sm">لا توجد ديون مستقبلية مسجلة.</p>
                <button onClick={() => setShowDebtModal(true)} className="mt-4 text-sm font-black underline" style={{ color: primaryColor }}>إضافة دين جديد</button>
             </div>
           )}
        </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-200">
             <h3 className="text-2xl font-black text-slate-800 mb-6">إنشاء فاتورة جديدة</h3>
             <form onSubmit={handleSubmitInvoice} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">الموكل</label>
                   <select 
                     required
                     className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-600"
                     onChange={e => setNewInvoice({...newInvoice, clientId: e.target.value})}
                     value={newInvoice.clientId || ''} // Ensure default value is set for controlled component
                   >
                     <option value="">اختر الموكل...</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">ربط بالقضية (اختياري)</label>
                   <select 
                     className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-600"
                     onChange={e => setNewInvoice({...newInvoice, caseId: e.target.value || undefined})}
                     value={newInvoice.caseId || ''}
                   >
                     <option value="">لا يوجد</option>
                     {clients.find(c => c.id === newInvoice.clientId)?.totalCases && cases.filter(c => c.clientId === newInvoice.clientId).map(c => <option key={c.id} value={c.id}>{c.title} ({c.caseNumber})</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">المبلغ الإجمالي (د.إ)</label>
                   <input 
                     type="number" 
                     required
                     className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-600"
                     onChange={e => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
                     value={newInvoice.amount || ''} // Ensure default value is set for controlled component
                     step="0.01" min="0"
                   />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 block">الوصف / البيان</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-600"
                     onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}
                     value={newInvoice.description || ''} // Ensure default value is set for controlled component
                   />
                </div>
                {invoiceFormError && <p className="text-red-500 text-[10px] font-bold text-center mt-2 bg-red-500/10 py-2 rounded-lg">{invoiceFormError}</p>}

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all">إلغاء</button>
                   <button type="submit" className="text-white flex-1 py-3 font-black rounded-xl shadow-lg hover:bg-blue-600 transition-all" style={{ backgroundColor: primaryColor }}>حفظ الفاتورة</button>
                </div>
             </form>
           </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-200">
             <h3 className="text-xl font-black text-slate-800 mb-4">تسجيل دفعة</h3>
             <p className="text-slate-500 text-xs mb-6">المبلغ المتبقي: <span className="font-bold text-red-500">{(selectedInvoice.amount - (selectedInvoice.paidAmount || 0)).toLocaleString()} د.إ</span></p>
             <form onSubmit={handleRecordPayment} className="space-y-4">
                <input type="number" placeholder="المبلغ المستلم" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none text-center font-black text-xl focus:ring-2 focus:ring-green-500/5 focus:border-green-600" required onChange={e => setPaymentAmount(e.target.value)} value={paymentAmount} step="0.01" min="0" max={selectedInvoice.amount - (selectedInvoice.paidAmount || 0)} />
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all">إلغاء</button>
                   <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-black rounded-xl shadow-lg hover:bg-green-700 transition-all">تأكيد</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showPrintInvoiceModal && selectedInvoice && clients.find(c => c.id === selectedInvoice.clientId) && (
        <PrintInvoiceModal 
          invoice={selectedInvoice} 
          client={clients.find(c => c.id === selectedInvoice.clientId)!} 
          settings={settings}
          cases={cases} // Pass cases to print modal for case title
          onClose={() => setShowPrintInvoiceModal(false)} 
        />
      )}
    </div>
  );
}
