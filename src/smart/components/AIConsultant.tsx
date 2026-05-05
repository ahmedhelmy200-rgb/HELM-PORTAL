
import React, { useState, useRef, useEffect } from 'react';
import { getAdvancedLegalChat, editImageWithGemini, generateVeoVideo, generateProImage } from '../services/geminiService';
import { ChatMessage, SystemSettings } from '../types';

interface AIConsultantProps {
  onBack: () => void;
  settings: SystemSettings; // Added settings prop
}

const AIConsultant: React.FC<AIConsultantProps> = ({ onBack, settings }) => { // Destructure settings
  const { primaryColor } = settings; // Get primaryColor from settings
  const [activeTab, setActiveTab] = useState<'chat' | 'creative' | 'voice'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'مرحباً بك في مركز أحمد حلمي للذكاء القانوني. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Creative Mode Settings
  const [mediaTask, setMediaTask] = useState<'pro-image' | 'veo-video' | 'edit-image'>('pro-image');
  const [proSize, setProSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  
  // Chat Settings
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcessRequest = async () => {
    if (!input.trim() && !uploadedImage) return;
    const currentInput = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: currentInput, image: uploadedImage || undefined }]);
    setIsLoading(true);

    try {
      if (activeTab === 'chat') {
        const result = await getAdvancedLegalChat(currentInput, { useSearch, useMaps, useThinking, image: uploadedImage || undefined });
        setMessages(prev => [...prev, { role: 'ai', text: result.text, links: result.links }]);
      } 
      else if (activeTab === 'creative') {
        let resultMedia = null;
        if (mediaTask === 'pro-image') {
          resultMedia = await generateProImage(currentInput, proSize, aspectRatio);
          setMessages(prev => [...prev, { role: 'ai', text: 'تم توليد الصورة الاحترافية بنجاح:', image: resultMedia || undefined }]);
        } else if (mediaTask === 'veo-video') {
          resultMedia = await generateVeoVideo(currentInput, uploadedImage || undefined, aspectRatio as any);
          setMessages(prev => [...prev, { role: 'ai', text: 'تم توليد الفيديو باستخدام Veo:', video: resultMedia }]);
        } else if (mediaTask === 'edit-image' && uploadedImage) {
          resultMedia = await editImageWithGemini(uploadedImage, currentInput);
          setMessages(prev => [...prev, { role: 'ai', text: 'تم تعديل الصورة وفقاً لطلبك:', image: resultMedia || undefined }]);
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `عذراً، حدث خطأ: ${error.message}` }]);
    }
    
    setIsLoading(false);
    setUploadedImage(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Premium Header */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 transition-all text-slate-600 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800">المستشار الذكي <span style={{ color: primaryColor }}>(حُلم 3.0)</span></h2> {/* Apply primaryColor */}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Advanced Legal Intelligence</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {['chat', 'creative', 'voice'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === t ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === t ? { backgroundColor: primaryColor, color: 'white' } : {}}> {/* Apply primaryColor, text is white */}
              {t === 'chat' ? 'المحادثة الذكية' : t === 'creative' ? 'الاستوديو الإبداعي' : 'المحادثة الصوتية'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-slide-up`}>
              <div className={`max-w-[85%] lg:max-w-[70%] p-8 rounded-[2.5rem] shadow-sm border ${m.role === 'user' ? 'bg-slate-100 border-slate-200 rounded-tr-none text-slate-700' : 'text-white border-transparent rounded-tl-none'}`} style={m.role === 'ai' ? { background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}cc)` } : {}}> {/* Apply primaryColor gradient */}
                {m.image && <img src={m.image} className="w-full rounded-3xl mb-4 border border-slate-200 shadow-lg" alt="Legal Data" />}
                {m.video && <video src={m.video} controls className="w-full rounded-3xl mb-4 shadow-lg border border-slate-200" />}
                <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'ai' ? 'text-white font-bold' : 'text-slate-700'}`}>{m.text}</p>
                {m.links && m.links.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-300 flex flex-wrap gap-2">
                    {m.links.map((link, li) => (
                      <a key={li} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-200 text-slate-800 px-4 py-1.5 rounded-full font-bold border border-slate-300 hover:bg-slate-300 transition-colors">
                        {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-slate-100 p-6 rounded-[2.5rem] border border-slate-200 flex items-center gap-4 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor }}></div> {/* Apply primaryColor */}
                  <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]" style={{ backgroundColor: primaryColor }}></div> {/* Apply primaryColor */}
                  <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]" style={{ backgroundColor: primaryColor }}></div> {/* Apply primaryColor */}
                </div>
                {/* [FIX]: Changed text color for better contrast on light background */}
                <span className="text-[10px] font-black uppercase text-slate-700">جاري التفكير بعمق...</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Control Panel */}
        <div className="p-8 bg-white/90 backdrop-blur-2xl border-t border-slate-200">
          {activeTab === 'chat' && (
            <div className="flex gap-4 mb-6">
              <button onClick={() => setUseSearch(!useSearch)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${useSearch ? 'text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-600'}`} style={useSearch ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}> {/* Apply primaryColor */}
                جوجل سيرش
              </button>
              <button onClick={() => setUseMaps(!useMaps)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${useMaps ? 'text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-600'}`} style={useMaps ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}> {/* Apply primaryColor */}
                خرائط جوجل
              </button>
              <button onClick={() => setUseThinking(!useThinking)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${useThinking ? 'text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-600'}`} style={useThinking ? { backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' } : {}}> {/* Apply primaryColor */}
                وضع التفكير (Pro Thinking)
              </button>
            </div>
          )}

          {activeTab === 'creative' && (
            <div className="flex flex-wrap gap-4 mb-6">
              {/* [FIX]: Removed unsupported focusRingColor and focusBorderColor */}
              <select value={mediaTask} onChange={(e: any) => setMediaTask(e.target.value)} className="w-full md:w-auto bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black outline-none text-slate-800">
                <option value="pro-image">توليد صورة (Gemini Pro)</option>
                <option value="veo-video">توليد فيديو (Veo 3)</option>
                <option value="edit-image">تعديل صورة (Flash Image)</option>
              </select>
              {mediaTask === 'pro-image' && (
                // [FIX]: Removed unsupported focusRingColor and focusBorderColor
                <select value={proSize} onChange={(e: any) => setProSize(e.target.value)} className="w-full md:w-auto bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black outline-none text-slate-800">
                  <option value="1K">دقة 1K</option>
                  <option value="2K">دقة 2K</option>
                  <option value="4K">دقة 4K الفائقة</option>
                </select>
              )}
              {/* [FIX]: Removed unsupported focusRingColor and focusBorderColor */}
              <select value={aspectRatio} onChange={(e: any) => setAspectRatio(e.target.value)} className="w-full md:w-auto bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black outline-none text-slate-800">
                <option value="16:9">أبعاد 16:9</option>
                <option value="9:16">أبعاد 9:16</option>
                <option value="1:1">أبعاد 1:1</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              {uploadedImage && (
                <div className="absolute -top-16 right-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <img src={uploadedImage} className="w-10 h-10 rounded-xl object-cover" alt="Uploaded" />
                  <span className="text-[9px] font-bold text-slate-500">مستند مرفق</span>
                  <button onClick={() => setUploadedImage(null)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              )}
              <div className="flex gap-3 bg-slate-100 border border-slate-200 rounded-[2rem] p-3 shadow-inner">
                {/* [FIX]: Removed custom CSS properties, use direct values */}
                <label className="p-4 bg-white text-slate-600 rounded-[1.5rem] hover:text-white transition-all cursor-pointer shadow-sm border border-slate-200" style={{ backgroundColor: 'white', borderColor: 'rgb(226, 232, 240)', color: 'rgb(71, 85, 105)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessRequest()}
                  placeholder={activeTab === 'chat' ? 'اسأل المستشار عن موقف قانوني...' : 'صف المحتوى المرئي المطلوب...'}
                  className="flex-1 bg-transparent px-4 text-sm outline-none font-medium placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>
            <button 
              onClick={handleProcessRequest} 
              disabled={isLoading || (!input.trim() && !uploadedImage)} 
              className="bg-slate-900 text-white h-[68px] px-10 rounded-[2rem] font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 disabled:hover:bg-slate-900"
              style={{ backgroundColor: primaryColor }} // Apply primaryColor
            >
              إرسال الطلب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultant;
