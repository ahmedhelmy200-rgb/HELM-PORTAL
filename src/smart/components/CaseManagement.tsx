
import React, { useState, useEffect } from 'react';
import { LegalCase, CaseStatus, CaseCategory, Client, UserRole, CaseComment, CaseActivity, LegalDocument, SystemSettings } from '../types';
import { analyzeCaseStrategy } from '../services/geminiService';
import { ICONS, STATUS_COLORS } from '../constants'; // Import STATUS_COLORS

interface CaseManagementProps {
  cases: LegalCase[];
  clients: Client[];
  documents: LegalDocument[]; // Add documents prop
  userRole: UserRole;
  onAddCase: (newCase: LegalCase) => void;
  onUpdateCase: (updatedCase: LegalCase) => void;
  onAddDocument: (newDocument: LegalDocument) => void; // Add document handler
  onBack: () => void;
  settings: SystemSettings; // Add settings prop
}

const CaseManagement: React.FC<CaseManagementProps> = ({ cases, clients, documents, userRole, onAddCase, onUpdateCase, onAddDocument, onBack, settings }) => {
  const { primaryColor } = settings;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  // Fix: Add 'strategy' to activeDetailTab options
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'comments' | 'activities' | 'documents' | 'strategy'>('details');
  const [commentInput, setCommentInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const [newCaseForm, setNewCaseForm] = useState<Partial<LegalCase>>({
    category: CaseCategory.CIVIL,
    subCategory: '',
    status: CaseStatus.ACTIVE,
    totalFee: 0,
    paidAmount: 0,
    clientId: ''
  });

  const [newDocumentData, setNewDocumentData] = useState<Partial<LegalDocument>>({
    title: '',
    category: 'Other',
    uri: '',
    fileName: '',
    mimeType: ''
  });
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);


  const canModify = userRole === 'admin' || userRole === 'staff';
  const canArchive = userRole === 'admin';

  useEffect(() => {
    if (newCaseForm.category) {
       setNewCaseForm(prev => ({ ...prev, subCategory: '' }));
    }
  }, [newCaseForm.category]);

  const logActivity = (currentCase: LegalCase, type: CaseActivity['type'], description: string): LegalCase => {
    const activity: CaseActivity = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description,
      userRole,
      userName: userRole === 'admin' ? 'إدارة المكتب' : (userRole === 'staff' ? 'SAMAR' : currentCase.clientName),
      timestamp: new Date().toLocaleDateString('ar-AE', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    };
    return {
      ...currentCase,
      activities: [activity, ...(currentCase.activities || [])]
    };
  };

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newCaseForm.clientId);
    let caseToAdd: LegalCase = {
      ...newCaseForm as LegalCase,
      id: Math.random().toString(36).substr(2, 9),
      clientName: client?.name || 'عميل جديد',
      createdAt: new Date().toLocaleDateString('ar-AE'),
      documents: [],
      comments: [],
      activities: [],
      isArchived: false,
      subCategory: newCaseForm.subCategory || 'عام',
      assignedLawyer: 'المستشار أحمد حلمي'
    };
    onAddCase(caseToAdd);
    setShowAddModal(false);
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!selectedCase || selectedCase.status === newStatus) return;
    let updatedCase: LegalCase = { ...selectedCase, status: newStatus };
    updatedCase = logActivity(updatedCase, 'status_change', `تغيير حالة الملف من ${selectedCase.status} إلى ${newStatus}`);
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
  };

  const handleAddComment = () => {
    if (!selectedCase || !commentInput.trim()) return;
    const newComment: CaseComment = {
      id: Math.random().toString(36).substr(2, 9),
      authorRole: userRole,
      authorName: userRole === 'admin' ? 'إدارة المكتب' : (userRole === 'staff' ? 'SAMAR' : selectedCase.clientName),
      text: commentInput,
      date: new Date().toLocaleDateString('ar-AE')
    };
    let updatedCase: LegalCase = { ...selectedCase, comments: [...(selectedCase.comments || []), newComment] };
    updatedCase = logActivity(updatedCase, 'comment_added', 'إضافة ملاحظة جديدة على الملف');
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setCommentInput('');
  };

  const handleGetSmartTip = async () => {
    if (!selectedCase) return;
    setIsAnalyzing(true);
    // Fix: Set activeDetailTab to 'strategy' when analysis is requested
    setActiveDetailTab('strategy');
    const result = await analyzeCaseStrategy(
        `القضية: ${selectedCase.title}, المحكمة: ${selectedCase.court}, الخصم: ${selectedCase.opponentName}, الحالة: ${selectedCase.status}`,
        selectedCase.court,
        selectedCase.status,
        selectedCase.opponentName
    );
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const getActivityIcon = (type: CaseActivity['type']) => {
    switch (type) {
      case 'status_change': return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>;
      case 'comment_added': return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm border border-green-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>;
      case 'document_added': return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm border border-purple-200"><ICONS.Document className="w-4 h-4" /></div>; // New document icon
      default: return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm border border-slate-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
    }
  };

  const handleDocumentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newDocumentData.title || !newDocumentData.uri) return;

    const newDoc: LegalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: newDocumentData.title,
      category: newDocumentData.category || 'Other',
      uri: newDocumentData.uri,
      fileName: newDocumentData.fileName || 'غير معروف',
      mimeType: newDocumentData.mimeType || 'application/octet-stream',
      uploadDate: new Date().toLocaleDateString('ar-AE'),
      clientId: selectedCase.clientId,
      caseId: selectedCase.id,
    };

    onAddDocument(newDoc);
    
    // Update case with new document ID
    let updatedCase = { ...selectedCase, documents: [...(selectedCase.documents || []), newDoc.id] };
    updatedCase = logActivity(updatedCase, 'document_added', `تم رفع مستند جديد: ${newDoc.title}`);
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </button>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة القضايا</h2>
              <p className="text-slate-400 font-bold text-sm mt-1">تصنيف البلاغات، الأرشفة، والمتابعة</p>
           </div>
        </div>
        {canModify && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all text-xs"
            style={{ backgroundColor: primaryColor }}
          >
            + تسجيل قضية جديدة
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">رقم القضية</th>
              <th className="px-6 py-4">عنوان القضية</th>
              <th className="px-6 py-4">الموكل</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.filter(c => !c.isArchived).map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{c.caseNumber}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{c.title}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-500">{c.clientName}</td>
                <td className="px-6 py-4">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${STATUS_COLORS[c.status]}`}>
                     {c.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <button 
                    onClick={() => { setSelectedCase(c); setActiveDetailTab('details'); setAnalysisResult(null); }}
                    className="bg-slate-100 text-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                   >التفاصيل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedCase.title}</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">رقم الملف: {selectedCase.caseNumber}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex flex-wrap border-b border-slate-100 bg-slate-50 px-6 items-center sticky top-[88px] z-10">
                <button onClick={() => setActiveDetailTab('details')} className={`px-4 py-4 text-xs font-black border-b-2 transition-colors ${activeDetailTab === 'details' ? 'text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`} style={activeDetailTab === 'details' ? { borderColor: primaryColor } : {}}>التفاصيل</button>
                <button onClick={() => setActiveDetailTab('documents')} className={`px-4 py-4 text-xs font-black border-b-2 transition-colors ${activeDetailTab === 'documents' ? 'text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`} style={activeDetailTab === 'documents' ? { borderColor: primaryColor } : {}}>المستندات ({documents.filter(d => d.caseId === selectedCase.id).length})</button>
                <button onClick={() => setActiveDetailTab('comments')} className={`px-4 py-4 text-xs font-black border-b-2 transition-colors ${activeDetailTab === 'comments' ? 'text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`} style={activeDetailTab === 'comments' ? { borderColor: primaryColor } : {}}>الملاحظات ({selectedCase.comments?.length || 0})</button>
                <button onClick={() => setActiveDetailTab('activities')} className={`px-4 py-4 text-xs font-black border-b-2 transition-colors ${activeDetailTab === 'activities' ? 'text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`} style={activeDetailTab === 'activities' ? { borderColor: primaryColor } : {}}>النشاطات</button>
                {/* Fix: Moved 'strategy' to be its own tab option */}
                <button onClick={() => setActiveDetailTab('strategy')} className={`px-4 py-4 text-xs font-black border-b-2 transition-colors ${activeDetailTab === 'strategy' ? 'text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`} style={activeDetailTab === 'strategy' ? { borderColor: primaryColor } : {}}>الاستراتيجية</button>
                
                {/* AI Tip Button next to tabs */}
                {canModify && (
                   <button 
                     onClick={handleGetSmartTip}
                     disabled={isAnalyzing}
                     className="mr-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                     style={{ backgroundColor: primaryColor }}
                   >
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     {/* [FIX]: Change text color for better contrast on dark background if needed, or keep white */}
                     <span className="text-white">{isAnalyzing ? 'جاري التحليل...' : 'استراتيجية ذكية'}</span>
                   </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scroll p-8 space-y-8 bg-slate-50">
                {activeDetailTab === 'details' && (
                  <section className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بيانات القضية</p>
                       {canModify && (
                          <select 
                            value={selectedCase.status}
                            onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                            className="bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-blue-600"
                          >
                            {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                       <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">التصنيف</p><p className="font-bold text-slate-700">{selectedCase.category}</p></div>
                       <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">الموكل</p><p className="font-bold text-slate-700">{selectedCase.clientName}</p></div>
                       <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">الخصم</p><p className="font-bold text-slate-700">{selectedCase.opponentName || '-'}</p></div>
                       <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">المحكمة</p><p className="font-bold text-slate-700">{selectedCase.court || '-'}</p></div>
                       <div className="col-span-2 pt-6 border-t border-slate-100 mt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">الموقف المالي</p>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-slate-100 p-4 rounded-2xl border border-slate-200">
                               <p className="text-[9px] text-slate-500 font-bold mb-1">الأتعاب</p>
                               <p className="font-black text-slate-800 text-lg">{(selectedCase.totalFee || 0).toLocaleString()} <span className="text-xs">د.إ</span></p>
                            </div>
                            <div className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100">
                               <p className="text-[9px] text-green-600 font-bold mb-1">المحصل</p>
                               <p className="font-black text-green-700 text-lg">{(selectedCase.paidAmount || 0).toLocaleString()} <span className="text-xs">د.إ</span></p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </section>
                )}
                
                {/* Fix: Moved strategy section to its own active tab check */}
                {activeDetailTab === 'strategy' && (
                  <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl min-h-[300px] flex flex-col relative overflow-hidden border border-slate-700" style={{ backgroundColor: primaryColor }}>
                    {/* [FIX]: Use rgba for background color with transparency string */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16" style={{ backgroundColor: `${primaryColor}10` }}></div>
                    {/* [FIX]: Changed text color for better contrast on background */}
                    <h4 className="text-slate-800 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10" style={{ color: 'white' }}>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                       نصيحة "حُلم" الذكية للمستشار
                    </h4>
                    {isAnalyzing ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                         {/* [FIX]: Use direct border color for primary highlight string */}
                         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}></div>
                         <p className="text-[10px] animate-pulse font-bold">جاري دراسة أوراق القضية وتحليل الثغرات...</p>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm text-xs leading-relaxed opacity-90 relative z-10" dangerouslySetInnerHTML={{ __html: analysisResult || 'لم يتم إجراء تحليل بعد.' }} />
                    )}
                  </section>
                )}
                
                {activeDetailTab === 'documents' && (
                  <section className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h4 className="text-xl font-black text-slate-800">مستندات القضية</h4>
                       {canModify && (
                         <button onClick={() => setShowDocumentUploadModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                           <ICONS.Upload className="w-4 h-4" /> رفع جديد
                         </button>
                       )}
                    </div>
                    <div className="space-y-4">
                       {documents.filter(d => d.caseId === selectedCase.id).map(doc => (
                         <a href={doc.uri} target="_blank" rel="noopener noreferrer" key={doc.id} className="block p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-600 transition-colors cursor-pointer group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-blue-600 border border-slate-200" style={{ color: primaryColor }}>
                                 <ICONS.Document className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                 {/* [FIX]: Use direct color values, remove custom property */}
                                 <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{doc.title}</p>
                                 <p className="text-[10px] text-slate-500 font-bold mt-1">{doc.fileName} ({doc.category})</p>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold">{doc.uploadDate}</span>
                           </div>
                         </a>
                       ))}
                       {documents.filter(d => d.caseId === selectedCase.id).length === 0 && (
                         <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                           لا توجد مستندات مرفقة بهذه القضية.
                         </div>
                       )}
                    </div>
                  </section>
                )}

                {activeDetailTab === 'comments' && (
                  <div className="flex flex-col h-full">
                     <div className="flex-1 space-y-4 mb-4">
                        {selectedCase.comments && selectedCase.comments.length > 0 ? (
                          selectedCase.comments.map(comment => (
                            <div key={comment.id} className={`p-4 rounded-2xl text-xs ${comment.authorRole === 'admin' || comment.authorRole === 'staff' ? 'bg-amber-50 mr-8 rounded-tr-none' : 'bg-slate-100 ml-8 rounded-tl-none'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-slate-600">{comment.authorName}</span>
                                <span className="text-[10px] text-slate-400">{comment.date}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">{comment.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                             <p className="text-slate-400 text-xs">لا توجد ملاحظات مسجلة.</p>
                          </div>
                        )}
                     </div>
                     <div className="flex gap-2 bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
                        <input 
                           className="flex-1 bg-transparent px-4 py-2 text-xs outline-none text-slate-700 placeholder:text-slate-400" 
                           placeholder="كتب ملاحظة..." 
                           value={commentInput}
                           onChange={(e) => setCommentInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button 
                          onClick={handleAddComment}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >إرسال</button>
                     </div>
                  </div>
                )}

                {activeDetailTab === 'activities' && (
                  <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      {selectedCase.activities && selectedCase.activities.length > 0 ? (
                        selectedCase.activities.map(activity => (
                           <div key={activity.id} className="relative flex gap-4 items-start">
                              <div className="z-10 bg-white p-1 rounded-full">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-black text-slate-600">{activity.userName}</span>
                                    <span className="text-[10px] text-slate-400">{activity.timestamp}</span>
                                 </div>
                                 <p className="text-xs font-bold text-slate-700">{activity.description}</p>
                              </div>
                           </div>
                        ))
                      ) : (
                        <p className="text-center text-xs text-slate-400 py-10 bg-white rounded-3xl border border-dashed border-slate-200">لا يوجد سجل نشاطات لهذا الملف.</p>
                      )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-fade-in relative">
            {/* [FIX]: Use rgba for background color with transparency string */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16" style={{ backgroundColor: `${primaryColor}10` }}></div>
            <h3 className="text-2xl font-black mb-8 text-slate-800 relative z-10">تسجيل بلاغ/قضية جديدة</h3>
            <form onSubmit={handleAddCase} className="grid grid-cols-2 gap-5 relative z-10">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">رقم القضية / البلاغ</label>
                <input required className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 transition-all text-sm font-bold text-slate-700" onChange={e => setNewCaseForm({...newCaseForm, caseNumber: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">عنوان القضية</label>
                <input required className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 transition-all text-sm font-bold text-slate-700" onChange={e => setNewCaseForm({...newCaseForm, title: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">التصنيف</label>
                <select className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 text-slate-700" onChange={e => setNewCaseForm({...newCaseForm, category: e.target.value as CaseCategory})}>
                  {Object.values(CaseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">الموكل</label>
                <select className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 text-slate-700" onChange={e => setNewCaseForm({...newCaseForm, clientId: e.target.value})}>
                  <option value="">اختر الموكل...</option>
                  {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 font-bold text-slate-500 hover:text-slate-700 transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all" style={{ backgroundColor: primaryColor }}>تسجيل القضية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-fade-in relative">
            <h3 className="text-2xl font-black text-slate-800 mb-6">رفع مستند جديد</h3>
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
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all" style={{ backgroundColor: primaryColor }}>رفع المستند</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
