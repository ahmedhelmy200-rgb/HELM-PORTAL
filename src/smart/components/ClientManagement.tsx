
import React, { useState } from 'react';
import { Client, LegalCase, Invoice, LegalDocument, CaseStatus, SystemSettings } from '../types'; // Import SystemSettings
import { ICONS, STATUS_COLORS } from '../constants'; // Import ICONS for document icon

interface ClientManagementProps {
  clients: Client[];
  cases: LegalCase[];
  invoices: Invoice[];
  documents: LegalDocument[]; // Add documents prop
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onAddDocument: (newDocument: LegalDocument) => void; // Add document handler
  onBack: () => void;
  settings: SystemSettings; // Add settings prop
}

const AccountStatementModal: React.FC<{ client: Client; invoices: Invoice[]; cases: LegalCase[]; settings: SystemSettings; onClose: () => void }> = ({ client, invoices, cases, settings, onClose }) => {
  const { logo, stamp, signature, primaryColor } = settings;
  const clientInvoices = invoices.filter(inv => inv.clientId === client.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentBalance = 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print-container"> {/* Changed to print-container */}
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-200 overflow-auto"> {/* This div is visible on screen */}
        
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
              <h3 className="text-xl font-black text-slate-800" style={{ color: primaryColor }}>كشف حساب موكل</h3>
              <p className="text-slate-500 text-sm mt-1">الموكل: {client.name}</p>
              <p className="text-slate-500 text-sm">تاريخ الكشف: {new Date().toLocaleDateString('ar-AE')}</p>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-black text-slate-500 uppercase mb-2">بيانات الموكل:</h4>
            <p className="text-lg font-bold text-slate-800">{client.name}</p>
            <p className="text-slate-600 text-sm">{client.address} | {client.phone} | {client.email}</p>
            <p className="text-slate-600 text-sm">رقم الهوية: {client.emiratesId}</p>
          </div>

          <table className="w-full text-right mb-10 border border-slate-200">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الوصف</th>
                <th className="p-4">القضية</th>
                <th className="p-4">مدين (المطلوب)</th>
                <th className="p-4">دائن (المدفوع)</th>
                <th className="p-4">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.length > 0 ? (
                clientInvoices.map(inv => {
                  const caseTitle = cases.find(c => c.id === inv.caseId)?.title || 'عام';
                  const debit = inv.amount;
                  const credit = inv.paidAmount || 0;
                  currentBalance += (credit - debit); // Payments increase balance, invoices decrease it.
                  return (
                    <tr key={inv.id} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-700">{inv.date}</td>
                      <td className="p-4 text-sm text-slate-700">{inv.description || 'فاتورة أتعاب'}</td>
                      <td className="p-4 text-sm text-slate-700">{caseTitle}</td>
                      <td className="p-4 text-sm font-bold text-red-600">{debit.toLocaleString()} د.إ</td>
                      <td className="p-4 text-sm font-bold text-green-600">{credit.toLocaleString()} د.إ</td>
                      <td className="p-4 text-sm font-bold">{currentBalance.toLocaleString()} د.إ</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="text-center p-4 text-slate-500 text-sm">لا توجد حركات مالية لهذا الموكل.</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-200 relative">
            <div>
              <h4 className="text-sm font-black text-slate-500 uppercase mb-2">الرصيد النهائي:</h4>
              <p className="text-3xl font-black" style={{ color: currentBalance >= 0 ? 'green' : 'red' }}>{currentBalance.toLocaleString()} د.إ</p>
            </div>
            <div className="text-center">
              {signature && <img src={signature} alt="Signature" className="h-20 w-auto mx-auto mb-2 object-contain" />}
              <p className="text-slate-700 font-bold text-sm">المستشار أحمد حلمي</p>
              <p className="text-slate-500 text-xs">المدير العام</p>
            </div>
            {stamp && <img src={stamp} alt="Stamp" className="absolute bottom-0 right-0 h-32 w-32 object-contain opacity-50 -rotate-12" />}
          </div>
        </div> {/* End printable-content */}
        
        <div className="no-print mt-6 text-center">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg hover:bg-blue-600 transition-all">طباعة كشف الحساب</button>
        </div>
      </div>
    </div>
  );
};


const ClientManagement: React.FC<ClientManagementProps> = ({ clients, cases, invoices, documents, onAddClient, onUpdateClient, onAddDocument, onBack, settings }) => {
  const { primaryColor } = settings;
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountStatementModal, setShowAccountStatementModal] = useState(false); // New state for account statement modal

  const [newDocumentData, setNewDocumentData] = useState<Partial<LegalDocument>>({
    title: '',
    category: 'Other',
    uri: '',
    fileName: '',
    mimeType: ''
  });
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  
  // State for new client form
  const [newClientData, setNewClientData] = useState({
    name: '',
    type: 'Individual' as 'Individual' | 'Corporate',
    phone: '',
    email: '',
    emiratesId: '',
    address: ''
  });

  const getClientStats = (clientId: string) => {
    const clientCases = cases.filter(c => c.clientId === clientId);
    const clientInvoices = invoices.filter(i => i.clientId === clientId);
    const totalBilled = clientInvoices.reduce((s, i) => s + i.amount, 0);
    const totalPaid = clientInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalDue = totalBilled - totalPaid;
    return { clientCases, totalBilled, totalPaid, totalDue };
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.phone.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.emiratesId?.includes(searchTerm)
  );

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        ...newClientData,
        createdAt: new Date().toLocaleDateString('ar-AE'),
        documents: [], // Store document IDs here
        totalCases: 0,
        balance: 0 // Initialize balance
    };
    onAddClient(newClient);
    setShowAddModal(false);
    setNewClientData({ name: '', type: 'Individual', phone: '', email: '', emiratesId: '', address: '' });
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedClient) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageResult = event.target?.result as string;
        const updatedClient = { ...selectedClient, profileImage: imageResult };
        onUpdateClient(updatedClient);
        setSelectedClient(updatedClient);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newDocumentData.title || !newDocumentData.uri) return;

    const newDoc: LegalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: newDocumentData.title,
      category: newDocumentData.category || 'Other',
      uri: newDocumentData.uri,
      fileName: newDocumentData.fileName || 'غير معروف',
      mimeType: newDocumentData.mimeType || 'application/octet-stream',
      uploadDate: new Date().toLocaleDateString('ar-AE'),
      clientId: selectedClient.id,
      caseId: newDocumentData.caseId // Optional case link
    };

    onAddDocument(newDoc);
    
    // Also update the client's documents list if necessary (storing document IDs)
    const updatedClient = { ...selectedClient, documents: [...selectedClient.documents, newDoc.id] };
    onUpdateClient(updatedClient);
    setSelectedClient(updatedClient);

    setShowDocumentUploadModal(false);
    setNewDocumentData({ title: '', category: 'Other', uri: '', fileName: '', mimeType: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocumentData(prev => ({
          ...prev,
          uri: reader.result as string,
          fileName: file.name,
          mimeType: file.type,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in font-sans">
      {!selectedClient ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="flex items-center gap-6">
              <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الموكلين</h2>
                <p className="text-slate-400 font-bold text-sm">البحث، الإضافة، ومتابعة السجلات</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 shadow-xl transition-all" style={{ backgroundColor: primaryColor }}>+ إضافة موكل جديد</button>
          </div>

          <div className="mb-10 relative">
             <input 
               type="text" 
               placeholder="ابحث عن موكل بالاسم أو الرقم..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-16 bg-white border border-slate-200 rounded-[1.5rem] px-12 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredClients.map(client => {
                const stats = getClientStats(client.id);
                return (
                  <div 
                    key={client.id} 
                    onClick={() => setSelectedClient(client)}
                    aria-label={`عرض تفاصيل الموكل ${client.name}`}
                    role="button" 
                    tabIndex={0}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 group"
                  >
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors overflow-hidden" style={{ color: primaryColor }}>
                        {client.profileImage ? (
                           <img src={client.profileImage} alt={`صورة ملف ${client.name}`} className="w-full h-full object-cover" />
                        ) : (
                           <p className="text-2xl font-black">{client.name.charAt(0)}</p>
                        )}
                     </div>
                     <h3 className="text-lg font-black text-slate-800 mb-1">{client.name}</h3>
                     <p className="text-xs text-slate-400 font-bold mb-6">{client.phone}</p>
                     <div className="flex gap-2">
                        <span className="bg-slate-50 text-[9px] font-black px-3 py-1.5 rounded-full border border-slate-200 text-slate-500">{client.type === 'Individual' ? 'فرد' : 'شركة'}</span>
                        {/* [FIX]: Changed text color for better contrast on light background */}
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-full border bg-blue-500/10 text-slate-800 uppercase tracking-widest" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>{stats.clientCases.length} قضايا</span>
                     </div>
                  </div>
                );
              })}
          </div>
        </>
      ) : (
        /* Client Detail View - Premium Light Theme */
        <div className="animate-in slide-in-from-left duration-300">
           <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-slate-100 to-transparent opacity-50"></div>
              
              <button onClick={() => setSelectedClient(null)} className="absolute top-8 left-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors z-10" aria-label="العودة إلى قائمة الموكلين">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
                 <div className="flex flex-col items-center">
                    <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-md overflow-hidden relative group">
                       {selectedClient.profileImage ? 
                         <img src={selectedClient.profileImage} alt={`صورة ملف ${selectedClient.name}`} className="w-full h-full object-cover" /> : 
                         <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-400">{selectedClient.name.charAt(0)}</div>
                       }
                       <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                          تغيير الصورة
                          <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                       </label>
                    </div>
                    {/* [FIX]: Changed text color for better contrast on light background */}
                    <span className="mt-4 px-4 py-1.5 bg-blue-500/10 text-slate-800 rounded-full text-[10px] font-black border border-blue-500/20" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
                      {selectedClient.type === 'Corporate' ? 'شركات' : 'أفراد'}
                    </span>
                 </div>

                 <div className="flex-1 space-y-8 w-full">
                    <div>
                       <h2 className="text-4xl font-black text-slate-800 mb-2">{selectedClient.name}</h2>
                       <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                          <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {selectedClient.phone}</span>
                          <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {selectedClient.email}</span>
                          <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2v4h6V8c-1.5 0-2-1.116-2-2" /></svg> {selectedClient.emiratesId}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">القضايا المسجلة</p>
                          <p className="text-3xl font-black text-slate-800">{getClientStats(selectedClient.id).clientCases.length}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الفواتير</p>
                          <p className="text-3xl font-black text-slate-800">{getClientStats(selectedClient.id).totalBilled.toLocaleString()} <span className="text-sm">د.إ</span></p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner relative overflow-hidden">
                          {/* [FIX]: Use rgba for background color with transparency string */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-xl" style={{ backgroundColor: `${primaryColor}10` }}></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">المبالغ المستحقة</p>
                          <p className="text-3xl font-black text-red-500">{getClientStats(selectedClient.id).totalDue.toLocaleString()} <span className="text-sm">د.إ</span></p>
                       </div>
                    </div>

                    <div>
                       <h3 className="text-xl font-black text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
                         <span className="w-1 h-5 bg-blue-600 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                         القضايا المرتبطة
                       </h3>
                       <div className="space-y-3">
                          {getClientStats(selectedClient.id).clientCases.map(c => (
                             <div key={c.id} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-200 hover:border-blue-600 transition-colors cursor-pointer group">
                                <div>
                                   {/* [FIX]: Use direct color values, remove custom property */}
                                   <p className="font-bold text-slate-700 text-sm group-hover:text-blue-600" style={{ color: `rgb(51, 65, 85)` }}>{c.title}</p>
                                   <p className="text-[10px] text-slate-500 font-bold mt-1">رقم: {c.caseNumber} • {c.court}</p>
                                </div>
                                <span className={`px-3 py-1 bg-white rounded-lg text-[10px] font-black border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                             </div>
                          ))}
                          {getClientStats(selectedClient.id).clientCases.length === 0 && (
                             <p className="text-slate-500 text-sm font-bold italic text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">لا توجد قضايا مسجلة لهذا الموكل.</p>
                          )}
                       </div>
                    </div>

                    <div>
                       <h3 className="text-xl font-black text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
                         <span className="w-1 h-5 bg-blue-600 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                         المستندات الرقمية
                       </h3>
                       <div className="space-y-4">
                          {documents.filter(d => d.clientId === selectedClient.id).map(d => (
                             <a href={d.uri} target="_blank" rel="noopener noreferrer" key={d.id} className="block p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-600 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                   {/* [FIX]: Use direct color values, remove custom property */}
                                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 shadow-sm" style={{ color: primaryColor }}>
                                      <ICONS.Document className="w-5 h-5" />
                                   </div>
                                   <div className="flex-1">
                                      {/* [FIX]: Use direct color values, remove custom property */}
                                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600" style={{ color: `rgb(51, 65, 85)` }}>{d.title}</p>
                                      <p className="text-[10px] text-slate-500 font-bold mt-1">{d.fileName} ({d.category})</p>
                                   </div>
                                   <span className="text-[9px] text-slate-400 font-bold">{d.uploadDate}</span>
                                </div>
                             </a>
                          ))}
                          {documents.filter(d => d.clientId === selectedClient.id).length === 0 && (
                             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                                لا توجد مستندات مرفقة لهذا الموكل.
                             </div>
                          )}
                          <button onClick={() => setShowDocumentUploadModal(true)} className="text-white w-full py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                            <ICONS.Upload className="w-4 h-4" /> رفع مستند جديد
                          </button>
                       </div>
                    </div>
                    
                    {/* Account Statement Button */}
                    <div className="pt-8 border-t border-slate-100">
                        <button 
                          onClick={() => setShowAccountStatementModal(true)}
                          className="text-white w-full py-4 bg-blue-600 rounded-2xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 2v-6m2 9H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            عرض كشف الحساب
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-slate-200 animate-fade-in relative">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-100 to-transparent opacity-50 rounded-t-[3rem] pointer-events-none"></div>
             
             <h3 className="text-2xl font-black text-slate-800 mb-8 relative z-10">إضافة موكل جديد</h3>
             <form onSubmit={handleSaveClient} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">الاسم الكامل</label>
                   <input 
                     required 
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                     value={newClientData.name}
                     onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">نوع الموكل</label>
                   <select 
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600"
                     value={newClientData.type}
                     onChange={e => setNewClientData({...newClientData, type: e.target.value as any})}
                   >
                     <option value="Individual">فرد (Individual)</option>
                     <option value="Corporate">شركة (Corporate)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">رقم الهاتف</label>
                   <input 
                     required 
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600 focus:bg-white dir-ltr text-right"
                     value={newClientData.phone}
                     onChange={e => setNewClientData({...newClientData, phone: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">البريد الإلكتروني</label>
                   <input 
                     type="email"
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600 focus:bg-white dir-ltr text-right"
                     value={newClientData.email}
                     onChange={e => setNewClientData({...newClientData, email: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">رقم الهوية / الرخصة</label>
                   <input 
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600 focus:bg-white"
                     value={newClientData.emiratesId}
                     onChange={e => setNewClientData({...newClientData, emiratesId: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">العنوان</label>
                   <input 
                     className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none focus:border-blue-600 focus:bg-white"
                     value={newClientData.address}
                     onChange={e => setNewClientData({...newClientData, address: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2 flex gap-4 mt-4">
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                   <button type="submit" className="text-white flex-1 py-4 font-black rounded-2xl shadow-lg hover:bg-blue-600 transition-all" style={{ backgroundColor: primaryColor }}>حفظ الموكل</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-fade-in relative">
            <h3 className="text-2xl font-black text-slate-800 mb-6">رفع مستند جديد للموكل {selectedClient.name}</h3>
            <form onSubmit={handleDocumentUpload} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">عنوان المستند</label>
                <input
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:border-blue-600"
                  value={newDocumentData.title}
                  onChange={e => setNewDocumentData({...newDocumentData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تصنيف المستند</label>
                <select
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:border-blue-600"
                  value={newDocumentData.category}
                  onChange={e => setNewDocumentData({...newDocumentData, category: e.target.value as any})}
                >
                  <option value="Contract">عقد</option>
                  <option value="Judgment">حكم</option>
                  <option value="Memo">مذكرة</option>
                  <option value="Receipt">إيصال</option>
                  <option value="EmiratesID">هوية إماراتية</option>
                  <option value="Passport">جواز سفر</option>
                  <option value="License">رخصة</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ربط بقضية (اختياري)</label>
                <select
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:border-blue-600"
                  value={newDocumentData.caseId || ''}
                  onChange={e => setNewDocumentData({...newDocumentData, caseId: e.target.value || undefined})}
                >
                  <option value="">لا يوجد</option>
                  {cases.filter(c => c.clientId === selectedClient.id).map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.caseNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">الملف</label>
                <input
                  type="file"
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:border-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
                {newDocumentData.fileName && <p className="text-xs text-slate-500 mt-2">الملف المحدد: {newDocumentData.fileName}</p>}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowDocumentUploadModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                <button type="submit" className="text-white flex-1 py-4 font-black rounded-2xl shadow-lg hover:bg-blue-600 transition-all" style={{ backgroundColor: primaryColor }}>رفع المستند</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountStatementModal && selectedClient && (
        <AccountStatementModal 
          client={selectedClient} 
          invoices={invoices} 
          cases={cases} 
          settings={settings}
          onClose={() => setShowAccountStatementModal(false)}
        />
      )}
    </div>
  );
};

export default ClientManagement;
