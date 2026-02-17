
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, AlertCircle, Layout, Download, Trash2, Image as ImageIcon, 
  Loader2, Plus, Info, X, Globe, FileCode, CheckCircle2, Gavel, 
  ChevronRight, ArrowRight, Settings2, Maximize, Layers, Zap, Send
} from 'lucide-react';
import { AnalysisStatus, CaseAnalysis, SlideData, SlideStyle, Source } from './types';
import { generateOutline, generateSlideContent, generateComplexScenarioVisual } from './services/geminiService';
import { generatePPT } from './services/pptService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [outline, setOutline] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'appearance'>('content');
  const [zoom, setZoom] = useState(1);
  const [statusLog, setStatusLog] = useState<{msg: string, done: boolean}[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current && previewRef.current.parentElement) {
        const parent = previewRef.current.parentElement;
        const scaleX = parent.clientWidth / 1280;
        const scaleY = (parent.clientHeight - 100) / 720;
        setZoom(Math.min(scaleX, scaleY, 0.85) * 0.95);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [analysis, activeIndex, status]);

  const addLog = (msg: string) => {
    setStatusLog(prev => [...prev.map(l => ({...l, done: true})), { msg, done: false }]);
  };

  const addUrlSource = () => {
    if (!urlInput.trim()) return;
    setSources([...sources, { id: Date.now().toString(), type: 'url', value: urlInput, name: urlInput }]);
    setUrlInput('');
  };

  const addFileSource = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      setSources([...sources, { 
        id: Date.now().toString(), 
        type: 'file', 
        value: ev.target?.result as string, 
        name: file.name 
      }]);
    };
    r.readAsText(file);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const startAnalysis = async () => {
    if (sources.length === 0) return;
    try {
      setStatus(AnalysisStatus.GENERATING_OUTLINE);
      setStatusLog([{ msg: "Extracting legal context from sources...", done: false }]);
      const res = await generateOutline(sources);
      addLog("Analyzing precedents and patterns...");
      setOutline(res);
      setStatus(AnalysisStatus.OUTLINE_READY);
    } catch (err: any) {
      setError(err.message);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const finalizeDeck = async () => {
    try {
      setStatus(AnalysisStatus.GENERATING_CONTENT);
      setStatusLog([
        { msg: "Finalizing narrative structure...", done: true },
        { msg: "Searching for validated brand identifiers...", done: false }
      ]);
      const res = await generateSlideContent(outline, sources);
      setAnalysis(res);
      setStatus(AnalysisStatus.READY);
    } catch (err: any) {
      setError(err.message);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const drawScenario = async (index: number) => {
    if (!analysis) return;
    const updated = { ...analysis };
    updated.slides[index].imageLoading = true;
    setAnalysis(updated);
    try {
      const img = await generateComplexScenarioVisual(updated.slides[index]);
      const final = { ...analysis };
      final.slides[index].imageUrl = img;
      final.slides[index].imageLoading = false;
      setAnalysis(final);
    } catch {
      const final = { ...analysis };
      final.slides[index].imageLoading = false;
      setAnalysis(final);
    }
  };

  const updateStyle = (styleData: Partial<SlideStyle>) => {
    if (!analysis) return;
    const next = { ...analysis };
    if (styleData.titleFontSize) styleData.titleFontSize = Math.min(styleData.titleFontSize, 32);
    if (styleData.bodyFontSize) styleData.bodyFontSize = Math.min(styleData.bodyFontSize, 20);
    next.slides[activeIndex].style = { ...next.slides[activeIndex].style, ...styleData };
    setAnalysis(next);
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysis(null);
    setOutline([]);
    setSources([]);
    setStatusLog([]);
  };

  const currentSlide = analysis?.slides[activeIndex];

  const getPreviewSizes = (slide: SlideData) => {
    const MAX_TITLE = 32;
    const MAX_BODY = 20;
    let t = Math.min(slide.style.titleFontSize, MAX_TITLE);
    let b = Math.min(slide.style.bodyFontSize, MAX_BODY);
    const totalChars = slide.points.reduce((acc, p) => acc + p.text.length, 0);
    if (totalChars > 600 || slide.points.length > 7) {
      b = Math.max(14, b * 0.85);
      t = Math.max(24, t * 0.9);
    }
    return { t, b };
  };

  const { t: previewTitleSize, b: previewBodySize } = currentSlide ? getPreviewSizes(currentSlide) : { t: 32, b: 18 };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-[#0F172A] overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Navigation */}
      <nav className="h-16 glass sticky top-0 px-8 flex items-center justify-between z-[100] border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Layers className="text-white" size={22} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">CaseLens <span className="text-indigo-600">Pro</span></span>
        </div>
        
        {status === AnalysisStatus.READY && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIsDownloading(true); generatePPT(analysis!).finally(() => setIsDownloading(false)); }}
              disabled={isDownloading}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Export Presentation
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Landing State */}
        {status === AnalysisStatus.IDLE && (
          <div className="w-full flex flex-col items-center justify-center p-12 studio-grid relative overflow-y-auto">
            <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-violet-100 rounded-full blur-[100px] opacity-60" />
            
            <div className="text-center space-y-6 max-w-3xl z-10 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <Zap size={14} /> New: Gemini 3.0 Pro Integration
              </div>
              <h1 className="text-7xl font-[900] text-slate-900 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
                Turn Case Data into <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">Executive Insight.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                The world's most advanced strategic synthesis tool for privacy experts and legal teams.
              </p>
            </div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 z-10">
              <div className="bg-white/80 glass p-10 rounded-[2.5rem] shadow-2xl space-y-8 group hover:shadow-indigo-100/50 transition-all border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Globe size={24} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Crawl & Distill</h3>
                </div>
                <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium pr-32" 
                      placeholder="https://example.com/legal-finding" 
                      value={urlInput} 
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addUrlSource()}
                    />
                    <button 
                      onClick={addUrlSource}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"
                    >
                      <Plus size={16} /> Submit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sources.filter(s => s.type === 'url').map(s => (
                      <div key={s.id} className="bg-indigo-50/50 border border-indigo-100 px-4 py-2 rounded-full flex items-center gap-3 animate-in zoom-in-95">
                        <span className="text-sm font-bold text-indigo-700 truncate max-w-[120px]">{s.name}</span>
                        <button onClick={() => removeSource(s.id)} className="text-indigo-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 glass p-10 rounded-[2.5rem] shadow-2xl space-y-8 group hover:shadow-violet-100/50 transition-all border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-inner">
                    <FileCode size={24} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Upload Evidence</h3>
                </div>
                <label className="border-2 border-dashed border-slate-200 rounded-[2rem] h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group">
                  <div className="bg-violet-100 p-2 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="text-violet-600" size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Drop PDF, TXT or Word docs</span>
                  <input type="file" className="hidden" onChange={addFileSource} />
                </label>
                <div className="flex flex-wrap gap-3">
                  {sources.filter(s => s.type === 'file').map(s => (
                    <div key={s.id} className="bg-violet-50/50 border border-violet-100 px-4 py-2 rounded-full flex items-center gap-3 animate-in zoom-in-95">
                      <span className="text-sm font-bold text-violet-700 truncate max-w-[120px]">{s.name}</span>
                      <button onClick={() => removeSource(s.id)} className="text-violet-300 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 z-10 w-full max-w-sm">
              <button 
                onClick={startAnalysis} 
                disabled={sources.length === 0}
                className={`w-full py-6 rounded-[2rem] font-extrabold text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group active:scale-95 ${
                  sources.length > 0 
                    ? 'bg-[#0F172A] text-white hover:scale-[1.02] hover:bg-slate-800' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Analyze Case <ArrowRight className={sources.length > 0 ? "group-hover:translate-x-1 transition-transform" : ""} />
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {(status === AnalysisStatus.GENERATING_OUTLINE || status === AnalysisStatus.GENERATING_CONTENT) && (
          <div className="w-full flex flex-col items-center justify-center bg-white studio-grid relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
               <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
            
            <div className="relative mb-12">
               <div className="w-40 h-40 border-[10px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-indigo-600" size={48} />
               </div>
            </div>
            
            <div className="max-w-md w-full text-center space-y-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Deep Synthesis in Progress</h2>
              <div className="bg-white shadow-xl rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                 {statusLog.map((log, i) => (
                   <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${log.done ? 'opacity-30 blur-[0.5px]' : 'opacity-100 scale-105'}`}>
                      {log.done ? <CheckCircle2 className="text-emerald-500" size={22} /> : <div className="w-5 h-5 bg-indigo-600 rounded-full animate-pulse" />}
                      <span className={`text-base font-bold ${log.done ? 'text-slate-500' : 'text-slate-900'}`}>{log.msg}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* Outline Refining State */}
        {status === AnalysisStatus.OUTLINE_READY && (
          <div className="w-full max-w-3xl mx-auto p-16 overflow-y-auto space-y-12 animate-in fade-in duration-700">
            <header className="flex items-end justify-between sticky top-0 bg-[#F1F5F9]/90 backdrop-blur-md z-50 py-6 border-b border-slate-200">
              <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Refine the Narrative</h2>
                <p className="text-slate-500 font-medium">Reorder or adjust the generated strategic flow.</p>
              </div>
              <button 
                onClick={finalizeDeck} 
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
              >
                Synthesize Deck
              </button>
            </header>
            
            <div className="space-y-6">
              {outline.map((o, i) => (
                <div key={i} className="group bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all">
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-xs font-black text-slate-300 uppercase w-6">{(i+1).toString().padStart(2, '0')}</span>
                    <input 
                      className="flex-1 bg-transparent border-0 font-extrabold text-slate-800 focus:ring-0 text-xl placeholder:text-slate-200" 
                      value={o} 
                      onChange={e => {
                        const n = [...outline];
                        n[i] = e.target.value;
                        setOutline(n);
                      }} 
                    />
                  </div>
                  <button onClick={() => setOutline(outline.filter((_, idx) => idx !== i))} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={22} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setOutline([...outline, 'New Analysis Layer'])} 
                className="w-full py-8 border-4 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-extrabold hover:text-indigo-600 hover:border-indigo-200 hover:bg-white transition-all group"
              >
                <Plus size={24} className="inline mr-2 group-hover:rotate-90 transition-transform" /> Add Critical Slide
              </button>
            </div>
          </div>
        )}

        {/* Studio Workspace */}
        {status === AnalysisStatus.READY && analysis && currentSlide && (
          <div className="flex-1 flex overflow-hidden bg-[#0F172A]">
            {/* Dark Sidebar */}
            <aside className="w-80 border-r border-slate-800 bg-[#0F172A] overflow-y-auto p-6 space-y-4 shrink-0 shadow-2xl">
              <div className="flex items-center justify-between px-2 mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategy Flow</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase">PG {activeIndex + 1} of {analysis.slides.length}</span>
              </div>
              <div className="space-y-3">
                {analysis.slides.map((s, i) => (
                  <button 
                    key={s.id} onClick={() => setActiveIndex(i)}
                    className={`w-full text-left p-4 rounded-2xl transition-all group relative ${activeIndex === i ? 'bg-indigo-600 shadow-xl shadow-indigo-900/40' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className={`text-[10px] font-black mb-1 tracking-wider ${activeIndex === i ? 'text-indigo-100' : 'text-slate-600'}`}>0{(i+1)}</div>
                    <div className={`text-sm font-bold line-clamp-1 ${activeIndex === i ? 'text-white' : 'text-slate-400'}`}>{s.title}</div>
                    {activeIndex === i && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  </button>
                ))}
              </div>
            </aside>

            {/* Stage Area */}
            <section className="flex-1 relative flex flex-col items-center justify-center p-12 overflow-hidden studio-grid bg-slate-100/10">
               {/* Viewport Stage */}
               <div 
                 ref={previewRef}
                 className="relative bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 border border-slate-200 rounded-sm" 
                 style={{ 
                   width: '1280px', 
                   height: '720px', 
                   transform: `scale(${zoom})`,
                   transformOrigin: 'center center',
                   backgroundColor: currentSlide.style.backgroundColor 
                 }}
               >
                  <div className="p-16 h-full w-full relative">
                    {currentSlide.type === 'title' && (
                      <div className="absolute" style={{ top: `${currentSlide.style.titleYPos}%`, left: `${currentSlide.style.titleXPos}%`, color: currentSlide.style.textColor }}>
                         <div className="flex items-center gap-10 mb-12">
                            {currentSlide.companyLogoUrl && currentSlide.companyLogoUrl.startsWith('http') && <img src={currentSlide.companyLogoUrl} className="h-24 w-24 object-contain" />}
                            <div className="h-16 w-px bg-slate-200 rotate-[30deg]" />
                            <span className="text-5xl font-black italic text-indigo-500 opacity-20 tracking-tighter">VS</span>
                            <div className="h-16 w-px bg-slate-200 rotate-[30deg]" />
                            {currentSlide.authorityLogoUrl && currentSlide.authorityLogoUrl.startsWith('http') && <img src={currentSlide.authorityLogoUrl} className="h-24 w-24 object-contain" />}
                         </div>
                         <h1 className="font-black tracking-tight leading-[0.95]" style={{ fontSize: `${previewTitleSize + 28}px` }}>
                           {currentSlide.companyName || "Organization"} <br/>
                           <span className="text-indigo-600">vs</span> {currentSlide.authorityName || "Regulator"}
                         </h1>
                         <div className="w-40 h-2 bg-indigo-600 my-10 rounded-full" />
                         <p className="text-3xl font-bold opacity-60 max-w-2xl">{analysis.subtitle}</p>
                      </div>
                    )}

                    {currentSlide.type === 'strategic_summary' && (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-12">
                          <h2 className="font-black tracking-tighter uppercase" style={{ fontSize: `${previewTitleSize}px`, color: currentSlide.style.textColor }}>{currentSlide.title}</h2>
                          <div className="text-sm font-black text-slate-400 tracking-widest">STRATEGIC DOSSIER</div>
                        </div>
                        <div className="flex gap-16 flex-1 overflow-hidden">
                          <div className="flex-1 flex flex-col gap-10">
                             {currentSlide.points.map((p, idx) => {
                               const keywords = ["What happened?", "Why did it happen?", "How do we avoid this?"];
                               const keyword = keywords.find(k => p.text.startsWith(k));
                               return keyword ? (
                                 <div key={idx} className="flex flex-col gap-4">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-1 bg-indigo-600 rounded-full" />
                                      <span className="font-black text-indigo-600 text-3xl uppercase tracking-tight">{keyword}</span>
                                   </div>
                                   <p className="text-2xl leading-relaxed text-slate-800 font-semibold" style={{ lineHeight: 1.5 }}>{p.text.substring(keyword.length).trim()}</p>
                                 </div>
                               ) : <p key={idx} className="text-xl font-medium" style={{ lineHeight: 1.5 }}>{p.text.trim()}</p>;
                             })}
                          </div>
                          <div className="w-[500px] bg-indigo-50 p-12 rounded-[3rem] border border-indigo-200 flex flex-col gap-8 shadow-inner relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200/50 rounded-full translate-x-10 -translate-y-10 blur-3xl" />
                             <div className="text-base font-black text-indigo-700 uppercase tracking-widest flex items-center gap-4 relative">
                                <Gavel size={24} className="text-indigo-400"/> Legal Determinations
                             </div>
                             <div className="space-y-10 relative">
                                {(currentSlide.authorityOpinions || []).map((o, oIdx) => (
                                  <div key={oIdx} className="text-2xl leading-relaxed text-indigo-900 italic font-extrabold flex items-start gap-4">
                                     <span className="text-indigo-300">"</span>
                                     <span className="border-l-4 border-indigo-300 pl-6">{o.trim()}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSlide.type !== 'title' && currentSlide.type !== 'strategic_summary' && (
                      <>
                        <div className="absolute" style={{ top: `${currentSlide.style.titleYPos}%`, left: `${currentSlide.style.titleXPos}%`, color: currentSlide.style.textColor }}>
                           <h2 className="font-black tracking-tight leading-tight uppercase border-l-8 border-indigo-600 pl-8" style={{ fontSize: `${previewTitleSize}px` }}>{currentSlide.title}</h2>
                        </div>
                        <div 
                          className="absolute flex flex-col gap-6"
                          style={{ 
                            top: `${currentSlide.style.bodyYPos}%`, 
                            left: `${currentSlide.style.bodyXPos}%`,
                            width: currentSlide.imageUrl ? `${currentSlide.style.imageXPos - currentSlide.style.bodyXPos - 5}%` : '85%',
                            lineHeight: 1.5,
                            color: currentSlide.style.textColor
                          }}
                        >
                           {currentSlide.points.map((p, idx) => (
                             <div key={idx} className="flex gap-6">
                               {!p.isHeading && (
                                 <div className="w-10 h-0.5 bg-indigo-300 mt-[1.2em] flex-shrink-0" />
                               )}
                               <div 
                                 className="leading-relaxed whitespace-pre-wrap" 
                                 style={{ 
                                   fontSize: `${p.fontSize || (p.isHeading ? previewBodySize + 6 : previewBodySize)}px`,
                                   fontWeight: p.bold || p.isHeading ? 900 : 500,
                                   color: p.color || 'inherit',
                                   lineHeight: 1.5
                                 }}
                               >
                                 {p.text.trim()}
                               </div>
                             </div>
                           ))}
                        </div>
                        {currentSlide.imageUrl && (
                          <div className="absolute" style={{ left: `${currentSlide.style.imageXPos}%`, top: `${currentSlide.style.imageYPos}%`, transform: `scale(${currentSlide.style.imageScale})`, width: '30%', height: '50%' }}>
                             <img src={currentSlide.imageUrl} className="max-w-full max-h-full object-cover rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border-8 border-white" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
               </div>

               {/* Advanced Floating Control Panel */}
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 dark-glass border border-white/10 rounded-[2.5rem] shadow-2xl p-4 flex items-center gap-10 w-full max-w-4xl z-50">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                    {['content', 'appearance'].map(t => (
                      <button 
                        key={t} onClick={() => setActiveTab(t as any)} 
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  
                  <div className="h-10 w-px bg-white/10" />
                  
                  <div className="flex-1">
                    {activeTab === 'content' && (
                      <div className="flex gap-6 items-center">
                        <button 
                          onClick={() => drawScenario(activeIndex)} 
                          disabled={currentSlide.imageLoading} 
                          className="flex items-center gap-3 text-xs font-black text-white bg-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50"
                        >
                          {currentSlide.imageLoading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />} 
                          AI Visual Synthesis
                        </button>
                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Info size={14} className="text-indigo-400" /> Smart content scaling active
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'appearance' && (
                      <div className="flex gap-10 items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                              <input 
                                type="color" 
                                value={currentSlide.style.backgroundColor} 
                                onChange={e => updateStyle({ backgroundColor: e.target.value })} 
                                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" 
                              />
                           </div>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Color</span>
                        </div>
                        
                        <div className="flex items-center gap-8">
                           <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-500 uppercase text-center">Vertical Alignment</span>
                              <input 
                                type="range" min="0" max="100" 
                                className="w-32 accent-indigo-600" 
                                value={currentSlide.style.titleYPos} 
                                onChange={e => updateStyle({ titleYPos: parseInt(e.target.value) })} 
                              />
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </section>
          </div>
        )}

        {/* Global Error Handle */}
        {status === AnalysisStatus.ERROR && (
          <div className="w-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-100">
               <AlertCircle size={48} />
            </div>
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Synthesis Halted</h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto text-lg leading-relaxed">{error || "An unexpected neural interruption occurred."}</p>
            </div>
            <button 
              onClick={reset} 
              className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Restart Workspace
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
