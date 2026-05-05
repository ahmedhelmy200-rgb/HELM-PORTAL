
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AIConsultant from './components/AIConsultant';
import CaseManagement from './components/CaseManagement';
import ClientManagement from './components/ClientManagement';
import Accounting from './components/Accounting';
import LawsLibrary from './components/LawsLibrary';
import AdminSettings from './components/AdminSettings';
import AuthLogin from './components/AuthLogin';
import OfficeSelector from './components/OfficeSelector';
import Sidebar from './components/Sidebar';
import Documents from './components/Documents'; // Import new Documents component
import { db } from './services/database';
import { base44 } from '@/api/base44Client';
import { LegalCase, Client, Invoice, UserRole, Expense, FutureDebt, SystemSettings, LegalDocument } from './types';
import { ICONS } from './constants';
import { useSession } from './services/session';

const App: React.FC = () => {
  const { user, activeOfficeId, activeRole, signOut } = useSession();

  const userRole: UserRole = activeRole === 'admin' ? 'admin' : (user ? 'staff' : 'visitor');
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [futureDebts, setFutureDebts] = useState<FutureDebt[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]); // New state for documents
  
  const [settings, setSettings] = useState<SystemSettings>({
    primaryColor: '#007bff', // Updated primary color to a vibrant blue
    language: 'ar',
    logo: '',
    stamp: '',
    signature: ''
  });

  useEffect(() => {
    // Set office scope for DB when available
    db.setOffice(activeOfficeId ?? null);
  }, [activeOfficeId]);

  const loadAllData = useCallback(async () => {
    if (user && !activeOfficeId) return;
    setIsLoading(true);
    try {
      const [clientsData, casesData, invoicesData, expensesData, debtsData, docsData] = await Promise.all([
        db.fetchAll('clients'),
        db.fetchAll('cases'),
        db.fetchAll('invoices'),
        db.fetchAll('expenses'),
        db.fetchAll('future_debts'),
        db.fetchAll('documents')
      ]);

      setClients(clientsData || []);
      setCases(casesData || []);
      setInvoices(invoicesData || []);
      setExpenses(expensesData || []);
      setFutureDebts(debtsData || []);
      setDocuments(docsData || []);

      const savedSettings = localStorage.getItem('helm_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeOfficeId]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    void loadAllData();
  }, [user, activeOfficeId, loadAllData]);

  // Realtime موحد على نفس جداول Portal، وليس change_log الخاص بالنسخة القديمة.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = base44.realtime.subscribe(() => {
      void loadAllData();
    }, ['clients', 'cases', 'invoices', 'expenses', 'future_debts', 'documents']);
    return unsubscribe;
  }, [user, loadAllData]);

  const handleLogout = () => {
    void signOut();
    setCurrentClientId(null);
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('helm_settings', JSON.stringify(newSettings));
  };

  const handleAddCase = async (newCase: LegalCase) => {
    try {
      const saved = await db.save('cases', newCase);
      setCases(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ القضية.');
    }
  };

  const handleUpdateCase = async (updatedCase: LegalCase) => {
    try {
      const saved = await db.update('cases', updatedCase.id, updatedCase);
      setCases(prev => prev.map(item => item.id === updatedCase.id ? saved : item));
    } catch (error: any) {
      alert(error?.message || 'تعذر تحديث القضية.');
    }
  };

  const handleAddClient = async (newClient: Client) => {
    try {
      const saved = await db.save('clients', newClient);
      setClients(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ الموكل.');
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const saved = await db.update('clients', updatedClient.id, updatedClient);
      setClients(prev => prev.map(item => item.id === updatedClient.id ? saved : item));
    } catch (error: any) {
      alert(error?.message || 'تعذر تحديث الموكل.');
    }
  };

  const handleAddInvoice = async (newInvoice: Invoice) => {
    try {
      const saved = await db.save('invoices', newInvoice);
      setInvoices(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ الفاتورة.');
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      const saved = await db.update('invoices', updatedInvoice.id, updatedInvoice);
      setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? saved : inv));
    } catch (error: any) {
      alert(error?.message || 'تعذر تحديث الفاتورة.');
    }
  };

  const handleAddExpense = async (newExpense: Expense) => {
    try {
      const saved = await db.save('expenses', newExpense);
      setExpenses(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ المصروف.');
    }
  };

  const handleAddFutureDebt = async (newDebt: FutureDebt) => {
    try {
      const saved = await db.save('future_debts', newDebt);
      setFutureDebts(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ المستحق المستقبلي.');
    }
  };

  const handleAddDocument = async (newDocument: LegalDocument) => {
    try {
      const saved = await db.save('documents', newDocument);
      setDocuments(prev => [saved, ...prev]);
    } catch (error: any) {
      alert(error?.message || 'تعذر رفع أو حفظ المستند.');
    }
  };

  const goBack = () => setActiveTab('dashboard');

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <div className="w-32 h-32 mb-8 animate-pulse">
            <ICONS.Logo />
        </div>
        <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#d4af37] animate-progress"></div>
        </div>
        <p className="mt-6 text-sm font-bold tracking-widest text-slate-400 uppercase">HELM SMART 3.5 IS LOADING...</p>
      </div>
    );
  }

  if (!user) return <AuthLogin />;
  if (!activeOfficeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dir-rtl">
        <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">جارٍ تحميل بيانات المكتب...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-50 min-h-screen relative overflow-x-hidden flex flex-col lg:flex-row-reverse dir-rtl font-sans selection:bg-[#d4af37] selection:text-white text-slate-800">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={handleLogout}
        logo={settings.logo}
        primaryColor={settings.primaryColor} // Pass primaryColor
      />

      <main className="flex-1 lg:mr-72 min-h-screen bg-slate-50">
        <OfficeSelector />
        {/* Mobile Header */}
        <div className="lg:hidden p-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="w-12 h-12" style={{ color: settings.primaryColor }}><ICONS.Logo /></div> {/* Apply primary color to logo */}
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>

        <div className="page-transition min-h-screen p-4 md:p-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              cases={cases} 
              clients={clients} 
              invoices={invoices} 
              userRole={userRole} 
              onNavigate={setActiveTab}
              logo={settings.logo}
              primaryColor={settings.primaryColor} // Pass primaryColor
            />
          )}

          {activeTab === 'ai-consultant' && <AIConsultant onBack={goBack} settings={settings} />}

          {activeTab === 'cases' && (
            <CaseManagement 
              cases={userRole === 'client' ? cases.filter(c => c.clientId === currentClientId) : cases} 
              clients={clients} 
              documents={documents} // Pass documents
              userRole={userRole} // Pass userRole
              onAddCase={handleAddCase} 
              onUpdateCase={handleUpdateCase} 
              onAddDocument={handleAddDocument} // Pass document handler
              onBack={goBack}
              settings={settings}
            />
          )}

          {activeTab === 'clients' && (
            <ClientManagement 
              clients={clients} 
              cases={cases} 
              invoices={invoices}
              documents={documents} // Pass documents
              onAddClient={handleAddClient} 
              onUpdateClient={handleUpdateClient} 
              onAddDocument={handleAddDocument} // Pass document handler
              onBack={goBack}
              settings={settings} // Pass settings for printing
            />
          )}
          
          {activeTab === 'documents' && ( // New Documents Tab
            <Documents
              documents={documents}
              clients={clients}
              cases={cases}
              onAddDocument={handleAddDocument}
              onBack={goBack}
              settings={settings} // Pass settings
            />
          )}

          {activeTab === 'accounting' && (
            <Accounting 
              invoices={userRole === 'client' ? invoices.filter(i => i.clientId === currentClientId) : invoices} 
              expenses={expenses}
              futureDebts={futureDebts}
              clients={clients}
              cases={cases}
              onAddExpense={handleAddExpense}
              onAddFutureDebt={handleAddFutureDebt}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onBack={goBack}
              settings={settings} // Pass settings for printing
            />
          )}

          {activeTab === 'laws' && <LawsLibrary onBack={goBack} settings={settings} />}

          {activeTab === 'settings' && (
            <AdminSettings settings={settings} onUpdateSettings={updateSettings} onBack={goBack} />
          )}
        </div>
      </main>

      <style>{`
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress { animation: progress 2s ease-in-out infinite; }
        .page-transition { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                background: white !important;
            }
            #root > div:not(.print-only) {
                display: none !important;
            }
            .print-only {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden; /* Hide scrollbars if any */
                z-index: 9999;
            }
            .no-print {
                display: none !important;
            }
            /* Specific styles for invoice/statement content */
            .printable-content {
                width: 210mm; /* A4 width */
                min-height: 297mm; /* A4 height */
                margin: 0 auto;
                background: white;
                box-shadow: none;
                border: none;
                padding: 20mm; /* Adjust padding as needed */
            }
        }
      `}</style>
    </div>
  );
};

export default App;
