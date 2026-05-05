
import React, { useState, useEffect } from 'react';
import { LegalDocument, Client, LegalCase, SystemSettings } from '../types'; // Import SystemSettings
import { ICONS } from '../constants';
import { analyzeDocumentForClientAndCase } from '../services/geminiService'; // For simulated smart reading

interface DocumentsProps {
  documents: LegalDocument[];
  clients: Client[];
  cases: LegalCase[];
  onAddDocument: (doc: LegalDocument) => void;
  onBack: () => void;
  settings: SystemSettings; // Add settings prop
}

export default function Documents({ documents, clients, cases, onAddDocument, onBack, settings }: DocumentsProps) {
  const { primaryColor } = settings;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isSmartAnalyzing, setIsSmartAnalyzing] = useState(false);
  const [useSmartUpload, setUseSmartUpload] = useState(true); // New state to toggle smart/manual upload

  const [newDocumentData, setNewDocumentData] = useState<Partial<LegalDocument>>({
    title: '',
    category: 'Other',
    uri: '',
    fileName: '',
    mimeType: '',
    clientId: '',
    caseId: ''
  });

  const allCategories = Array.from(new Set(documents.map(d => d.category)));

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? doc.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

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

  const handleSmartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumentData.uri || !newDocumentData.fileName) return;

    setIsSmartAnalyzing(true);
    // Simulate AI analysis
    const analysisResult = await analyzeDocumentForClientAndCase(newDocumentData.uri, clients, cases);
    setIsSmartAnalyzing(false);

    const detectedClientId = analysisResult.clientId;
    const detectedClientName = analysisResult.clientName;
    const detectedCaseId = analysisResult.caseId;
    const detectedCaseTitle = analysisResult.caseTitle;
    const detectedTitle = analysisResult.title || newDocumentData.fileName?.split('.')[0] || 'مستند بدون عنوان';

    const newDoc: LegalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: detectedTitle,
      category: newDocumentData.category || 'Other',
      uri: newDocumentData.uri,
      fileName: newDocumentData.fileName,
      mimeType: newDocumentData.mimeType,
      uploadDate: new Date().toLocaleDateString('ar-AE'),
      clientId: detectedClientId || '', // Ensure clientId is not undefined
      caseId: detectedCaseId,
      clientName: detectedClientName, // Store client name for display
      caseTitle: detectedCaseTitle // Store case title for display
    };

    onAddDocument(newDoc);
    setShowUploadModal(false);
    setNewDocumentData({ title: '', category: 'Other', uri: '', fileName: '', mimeType: '', clientId: '', caseId: '' });
    alert(`تم رفع المستند بذكاء! تم ربطه بـ: ${analysisResult.clientName || 'لا يوجد موكل'}، القضية: ${analysisResult.caseTitle || 'لا يوجد قضية'}`);
  };

  const handleManualUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumentData.uri || !newDocumentData.title || !newDocumentData.clientId) return;

    const newDoc: LegalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: newDocumentData.title,
      category: newDocumentData.category || 'Other',
      uri: newDocumentData.uri,
      fileName: newDocumentData.fileName || 'غير معروف',
      mimeType: newDocumentData.mimeType || 'application/octet-stream',
      uploadDate: new Date().toLocaleDateString('ar-AE'),
      clientId: newDocumentData.clientId,
      caseId: newDocumentData.caseId || undefined,
      clientName: clients.find(cl => cl.id === newDocumentData.clientId)?.name, // Get client name manually
      caseTitle: cases.find(cs => cs.id === newDocumentData.caseId)?.title // Get case title manually
    };

    onAddDocument(newDoc);
    setShowUploadModal(false);
    setNewDocumentData({ title: '', category: 'Other', uri: '', fileName: '', mimeType: '', clientId: '', caseId: '' });
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المستندات الرقمية</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">رفع، تصنيف، وربط المستندات بذكاء</p>
          </div>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
          <ICONS.Upload className="w-4 h-4" /> رفع مستند جديد
        </button>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 mb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="ابحث عن مستند بالعنوان أو اسم الملف..." 
              className="w-full h-16 bg-slate-50 border border-slate-200 rounded-3xl px-12 text-sm font-bold outline-none transition-all placeholder:text-slate-400 text-slate-700"
              style={{ borderColor: primaryColor }} // Fix: Use direct border color
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 custom-scroll">
            <button 
              onClick={() => setFilterCategory(null)}
              className={`px-8 h-16 rounded-3xl text-sm font-black whitespace-nowrap transition-all ${!filterCategory ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={!filterCategory ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              الكل
            </button>
            {allCategories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-8 h-16 rounded-3xl text-sm font-black whitespace-nowrap transition-all ${filterCategory === cat ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={filterCategory === cat ? { backgroundColor: primaryColor, color: 'white' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(doc => (
            <a href={doc.uri} target="_blank" rel="noopener noreferrer" key={doc.id} className="block p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-start gap-4 mb-4">
                {/* [FIX]: Changed icon color for better contrast on light background */}
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-blue-500/10 text-slate-600 transition-all" style={{ backgroundColor: `${primaryColor}10` }}>
                  <ICONS.Document className="w-7 h-7" />
                </div>
                <div>
                  {/* [FIX]: Changed text color for better contrast on light background */}
                  <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">{doc.fileName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-slate-400">
                <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{doc.category}</span>
                {doc.clientName && <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{doc.clientName}</span>}
                {doc.caseTitle && <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{doc.caseTitle}</span>}
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-4 text-left">تاريخ الرفع: {doc.uploadDate}</p>
            </a>
          ))
        ) : (
          <div className="lg:col-span-3 text-center py-24 bg-white rounded-[3rem] border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-slate-500 font-black">لا توجد مستندات مطابقة لبحثك أو الفلتر المحدد.</p>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-fade-in relative">
            <h3 className="text-2xl font-black text-slate-800 mb-6">رفع مستند رقمي جديد</h3>
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setUseSmartUpload(true)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all ${useSmartUpload ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                disabled={isSmartAnalyzing}
                style={useSmartUpload ? { backgroundColor: primaryColor, color: 'white' } : {}}
              >
                رفع بذكاء (AI)
              </button>
              <button 
                onClick={() => setUseSmartUpload(false)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all ${!useSmartUpload ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                disabled={isSmartAnalyzing}
                style={!useSmartUpload ? { backgroundColor: primaryColor, color: 'white' } : {}}
              >
                رفع يدوي
              </button>
            </div>
            
            {/* File Input */}
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

            {newDocumentData.uri && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 mb-2">معاينة المستند:</p>
                {newDocumentData.mimeType?.startsWith('image/') ? (
                  <img src={newDocumentData.uri} alt="Document Preview" className="max-w-full h-auto rounded-lg shadow-sm" />
                ) : (
                  <p className="text-xs text-slate-500">لا يمكن عرض معاينة لـ "{newDocumentData.mimeType}".</p>
                )}
              </div>
            )}

            <form onSubmit={useSmartUpload ? handleSmartUpload : handleManualUpload} className="space-y-5 mt-6">
              {isSmartAnalyzing ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm font-bold animate-pulse">جاري تحليل المستند بذكاء وربطه تلقائياً...</p>
                  {/* [FIX]: Use direct border color for primary highlight string */}
                  <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}></div>
                </div>
              ) : (
                !useSmartUpload && ( // Only show manual fields if not smart upload
                <>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ربط بالموكل</label>
                    <select
                      required
                      className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-bold outline-none focus:border-blue-600"
                      value={newDocumentData.clientId}
                      onChange={e => setNewDocumentData({...newDocumentData, clientId: e.target.value})}
                    >
                      <option value="">اختر الموكل...</option>
                      {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
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
                      {newDocumentData.clientId && cases.filter(c => c.clientId === newDocumentData.clientId).map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.caseNumber})</option>
                      ))}
                    </select>
                  </div>
                </>
              ))}
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors">إلغاء</button>
                <button type="submit" className="text-white flex-1 py-4 font-black rounded-2xl shadow-lg hover:bg-blue-600 transition-all" disabled={isSmartAnalyzing || !newDocumentData.uri}>
                  {isSmartAnalyzing ? 'جاري التحليل...' : 'رفع المستند'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
