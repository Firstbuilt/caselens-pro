
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, AlertCircle, Download, Trash2, Image as ImageIcon, 
  Loader2, Plus, Info, X, Globe, FileCode, CheckCircle2, Gavel, 
  ArrowRight, Layers, Zap, FileText, Presentation, RotateCcw, Copy,
  Sun, Moon, ChevronLeft, ChevronRight, PlayCircle
} from 'lucide-react';
import { AnalysisStatus, CaseAnalysis, SlideData, SlideStyle, Source, WordSection } from './types';
import { generateWordAnalysis, generatePPTFromWord, generateComplexScenarioVisual, validateSources, extractTextFromSources } from './services/geminiService';
import { generatePPT } from './services/pptService';
import { exportToWord } from './services/wordService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [wordContent, setWordContent] = useState<WordSection[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.4);
  const [statusLog, setStatusLog] = useState<{msg: string, done: boolean}[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Demo State
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);

  const demoImages = [
    "https://i.postimg.cc/FKS0rXCZ/demo1.png",
    "https://i.postimg.cc/hjbxmbBh/demo2.png",
    "https://i.postimg.cc/j2xf4wxF/demo3.png",
    "https://i.postimg.cc/wMqNQyqr/demo4.png",
    "https://i.postimg.cc/prsFGWyz/demo5.png",
    "https://i.postimg.cc/Wp8gbnSc/demo6.png",
    "https://i.postimg.cc/9XbZFp1q/demo7.png",
    "https://i.postimg.cc/DyzsWXYb/demo8.png",
  ];

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current && previewRef.current.parentElement) {
        const parent = previewRef.current.parentElement;
        const scaleX = (parent.clientWidth - 80) / 1280;
        const scaleY = (parent.clientHeight - 120) / 720;
        setZoom(Math.min(scaleX, scaleY, 0.55));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [analysis, status]);

  const addUrlSource = () => {
    if (!urlInput.trim()) return;
    setSources([...sources, { id: Date.now().toString(), type: 'url', value: urlInput, name: urlInput }]);
    setUrlInput('');
  };

  const useExample = () => {
    const example = "https://www.dataprotection.ie/sites/default/files/uploads/2023-01/Final%20Decision%20VIEC%20IN-21-2-5%20121222_Redacted.pdf";
    setUrlInput(example);
  };

  const addFileSource = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(',')[1];
      setSources([...sources, { 
        id: Date.now().toString(), 
        type: 'file', 
        value: base64, 
        name: file.name 
      }]);
    };
    r.readAsDataURL(file);
  };

  const removeSource = (id: string) => setSources(sources.filter(s => s.id !== id));

  const startAnalysis = async () => {
    if (sources.length === 0) return;
    try {
      setStatus(AnalysisStatus.EXTRACTING_TEXT);
      setStatusLog([{ msg: "Authenticating input validity...", done: false }]);
      
      const isValid = await validateSources(sources);
      if (!isValid) {
        setStatus(AnalysisStatus.VALIDATION_FAILED);
        return;
      }

      setStatusLog(prev => [...prev.map(l => ({...l, done: true})), { msg: "Extracting text from sources...", done: false }]);
      const text = await extractTextFromSources(sources);
      setExtractedText(text);
      setStatus(AnalysisStatus.TEXT_READY);
    } catch (err: any) {
      setError(err.message);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const proceedToAnalysis = async () => {
    try {
      setStatus(AnalysisStatus.ANALYZING_WORD);
      setStatusLog([{ msg: "Privacy Expert reviewing the extracted text...", done: false }]);
      const res = await generateWordAnalysis(extractedText);
      setWordContent(res);
      setStatus(AnalysisStatus.WORD_READY);
    } catch (err: any) {
      setError(err.message);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const generatePPTAction = async () => {
    try {
      setStatus(AnalysisStatus.GENERATING_PPT);
      setStatusLog([{ msg: "Synthesizing strategic deck from analysis...", done: false }]);
      const res = await generatePPTFromWord(wordContent);
      setAnalysis(res);
      setStatus(AnalysisStatus.READY);
    } catch (err: any) {
      setError(err.message);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysis(null);
    setWordContent([]);
    setExtractedText('');
    setSources([]);
    setStatusLog([]);
    setActiveIndex(0);
  };

  const currentSlide = analysis?.slides[activeIndex];

  return (
    <div className={`h-screen w-screen flex flex-col transition-colors duration-500 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/40 ${isDarkMode ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F8FAFC] text-[#1E293B]'} overflow-hidden`}>
      <nav className={`h-16 shrink-0 px-8 flex items-center justify-between z-[100] border-b transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]/80 border-slate-800' : 'glass border-slate-200'} backdrop-blur-xl`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Layers className="text-white" size={22} />
          </div>
          <span className={`font-extrabold text-xl tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            CaseLens <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDemoOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            <PlayCircle size={18} />
            演示项目
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {(status === AnalysisStatus.READY || status === AnalysisStatus.WORD_READY) && (
            <button onClick={reset} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <RotateCcw size={16}/> New Analysis
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {status === AnalysisStatus.IDLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 studio-grid overflow-y-auto custom-scrollbar">
            <div className="text-center space-y-6 max-w-3xl z-10 mb-16 animate-in fade-in duration-1000">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider mb-4 transition-colors ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                <Zap size={14} /> European Privacy Expert System
              </div>
              <h1 className={`text-6xl font-[900] tracking-tight leading-[1.1] transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Master the Complexity <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">of Global Compliance.</span>
              </h1>
              <p className={`text-xl font-medium max-w-xl mx-auto leading-relaxed transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Transform any case URL or PDF into professional legal dossiers and executive decks in seconds.
              </p>
            </div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 z-10">
              <div className={`p-10 rounded-[2.5rem] shadow-2xl space-y-6 border transition-all duration-500 group ${isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Globe size={24} />
                  </div>
                  <h3 className={`text-2xl font-extrabold tracking-tight transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Crawl URL</h3>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      className={`w-full p-5 rounded-2xl outline-none focus:ring-4 transition-all pr-24 border ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-indigo-500/20 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-[#1E293B] focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                      placeholder="Case URL, news, or findings..." 
                      value={urlInput} 
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addUrlSource()}
                    />
                    <button onClick={addUrlSource} className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md">Add</button>
                  </div>
                  <div className="px-1 space-y-2">
                    <p className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Info size={12} /> Example URL (Click to fill):
                    </p>
                    <div 
                      onClick={useExample}
                      className={`text-[10px] font-mono p-3 rounded-xl border cursor-pointer transition-all break-all leading-normal select-all ${isDarkMode ? 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                      https://www.dataprotection.ie/sites/default/files/uploads/2023-01/Final%20Decision%20VIEC%20IN-21-2-5%20121222_Redacted.pdf
                    </div>
                    <p className={`text-[10px] font-medium transition-colors italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Tip: If URL extraction fails due to site restrictions, please download the PDF and use the "Import PDF" option for 100% reliability.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 min-h-[40px]">
                  {sources.filter(s => s.type === 'url').map(s => (
                    <div key={s.id} className={`border px-4 py-2 rounded-full flex items-center gap-3 animate-in zoom-in-95 transition-colors ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                      <span className="text-xs font-bold truncate max-w-[150px]">{s.name}</span>
                      <button onClick={() => removeSource(s.id)} className="opacity-60 hover:opacity-100 hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-10 rounded-[2.5rem] shadow-2xl space-y-8 border transition-all duration-500 group ${isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-violet-500/50' : 'bg-white border-slate-100 hover:border-violet-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                    <FileCode size={24} />
                  </div>
                  <h3 className={`text-2xl font-extrabold tracking-tight transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Import PDF</h3>
                </div>
                <label className={`border-2 border-dashed rounded-[2rem] h-32 flex flex-col items-center justify-center cursor-pointer transition-all group ${isDarkMode ? 'border-slate-700 hover:bg-slate-800/50 hover:border-violet-500/30' : 'border-slate-200 hover:bg-slate-50 hover:border-violet-200'}`}>
                  <Plus className="text-violet-600 dark:text-violet-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Drop PDF evidence or dossiers</span>
                  <input type="file" className="hidden" onChange={addFileSource} />
                </label>
                <div className="flex flex-wrap gap-3 min-h-[40px]">
                  {sources.filter(s => s.type === 'file').map(s => (
                    <div key={s.id} className={`border px-4 py-2 rounded-full flex items-center gap-3 animate-in zoom-in-95 transition-colors ${isDarkMode ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-100 text-violet-700'}`}>
                      <span className="text-xs font-bold truncate max-w-[150px]">{s.name}</span>
                      <button onClick={() => removeSource(s.id)} className="opacity-60 hover:opacity-100 hover:text-red-500"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={startAnalysis} 
              disabled={sources.length === 0}
              className={`mt-12 w-full max-w-sm py-6 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-[#0F172A] text-white'}`}
            >
              Analyze Case <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {status === AnalysisStatus.VALIDATION_FAILED && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden mesh-gradient p-12">
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500 max-w-5xl">
              <div className="opacity-10 select-none pointer-events-none mb-4 transform hover:scale-105 transition-transform duration-1000">
                <span className="text-[18rem] md:text-[28rem] leading-none">😑</span>
              </div>
              
              <div className="space-y-8">
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter drop-shadow-2xl">
                  Come on! <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Are you sure</span> what you input is related to case decision?
                </h2>
                
                <p className="text-slate-400 font-bold text-lg uppercase tracking-widest opacity-60">Legal Protocol Violation Detected</p>
              </div>

              <button 
                onClick={reset}
                className="mt-16 px-16 py-6 bg-white text-black rounded-full font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_80px_rgba(255,255,255,0.2)] hover:bg-indigo-50 border-4 border-white"
              >
                My fault, retry!
              </button>
            </div>
          </div>
        )}

        {(status === AnalysisStatus.ANALYZING_WORD || status === AnalysisStatus.GENERATING_PPT || status === AnalysisStatus.EXTRACTING_TEXT) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center studio-grid z-50 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
             <div className="relative mb-12">
               <div className={`w-32 h-32 border-8 rounded-full animate-spin transition-colors ${isDarkMode ? 'border-slate-800 border-t-indigo-500' : 'border-slate-50 border-t-indigo-600'}`} />
               <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles className="text-indigo-600 dark:text-indigo-400" size={32} />
               </div>
             </div>
             <div className="max-w-md w-full text-center space-y-6">
                <h2 className={`text-3xl font-black tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {status === AnalysisStatus.EXTRACTING_TEXT ? "Extracting Source Text..." : 
                   status === AnalysisStatus.ANALYZING_WORD ? "GDPR Synthesis in Progress..." : "Designing Strategic Deck..."}
                </h2>
                <div className={`p-6 rounded-3xl shadow-xl border text-left space-y-3 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                   {statusLog.map((log, i) => (
                     <div key={i} className={`flex items-center gap-4 py-1 transition-all ${log.done ? 'opacity-30' : 'opacity-100'}`}>
                        {log.done ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={18} />}
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{log.msg}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {status === AnalysisStatus.TEXT_READY && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 studio-grid z-40 overflow-hidden">
            <div className={`w-full max-w-4xl h-[80vh] flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="p-8 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Copy size={24} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Extracted Text</h2>
                    <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Step 1: Raw Content Retrieval</p>
                  </div>
                </div>
                <button onClick={reset} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <textarea 
                  className={`w-full h-full bg-transparent border-0 focus:ring-0 resize-none font-mono text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Extracted text will appear here..."
                />
              </div>
              <div className="p-8 border-t flex justify-end gap-4 shrink-0">
                <button onClick={reset} className={`px-8 py-4 rounded-2xl font-bold transition-all ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cancel</button>
                <button onClick={proceedToAnalysis} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-3">
                  Analysis <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {(status === AnalysisStatus.WORD_READY || status === AnalysisStatus.READY) && (
          <div className="flex-1 flex overflow-hidden w-full h-full bg-white dark:bg-slate-900 transition-colors duration-500">
            {/* Word Analysis Editor Pane */}
            <div className={`flex flex-col border-r transition-all duration-700 h-full overflow-hidden ${status === AnalysisStatus.READY ? 'w-[45%]' : 'w-full'} ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md shrink-0 transition-colors ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className={`font-black text-lg leading-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Expert Dossier</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>GDPR Analysis Report</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportToWord(wordContent)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 ${isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Export Word</button>
                  {status === AnalysisStatus.WORD_READY && (
                    <button onClick={generatePPTAction} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
                       <Presentation size={16} /> Generate PPT
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 space-y-12 selection:bg-indigo-100 dark:selection:bg-indigo-900/40 custom-scrollbar scroll-smooth" style={{ fontFamily: 'Arial, sans-serif' }}>
                {wordContent.map((section, idx) => (
                  <div key={idx} className="group space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-1.5 bg-indigo-600 rounded-full" />
                      <h1 className={`text-2xl font-bold tracking-tight uppercase text-xs tracking-[0.2em] opacity-40 mb-2 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>{section.title}</h1>
                    </div>
                    <textarea 
                      className={`w-full text-[16px] bg-transparent border-0 focus:ring-0 resize-none p-0 overflow-hidden transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`} 
                      style={{ lineHeight: 1.6 }}
                      value={section.content}
                      onChange={(e) => {
                        const next = [...wordContent];
                        next[idx].content = e.target.value;
                        setWordContent(next);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>
                ))}
                <div className="h-24 shrink-0" />
              </div>
            </div>

            {/* Strategic PPT Pane */}
            {status === AnalysisStatus.READY && analysis && (
              <div className="flex-1 bg-[#0F172A] flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-700 relative h-full">
                <div className="p-6 bg-slate-800/30 border-b border-white/5 flex items-center justify-between z-20 shrink-0">
                   <div className="flex items-center gap-3 text-white">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Presentation size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">Strategic Presentation</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visual Synthesis Engine</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => { setIsDownloading(true); generatePPT(analysis).finally(() => setIsDownloading(false)); }}
                     disabled={isDownloading}
                     className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-indigo-50 flex items-center gap-2 shadow-2xl disabled:opacity-50 transition-all active:scale-95"
                   >
                     {isDownloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} Export PPTX
                   </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center relative p-12 bg-slate-900/50 studio-grid">
                   <div className="relative shrink-0">
                      <div 
                        ref={previewRef}
                        className="bg-white shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 border border-white/10 rounded-sm" 
                        style={{ 
                          width: '1280px', height: '720px', 
                          transform: `scale(${zoom})`,
                          backgroundColor: currentSlide?.style.backgroundColor 
                        }}
                      >
                         {currentSlide && (
                           <div className="p-20 h-full w-full relative">
                              {currentSlide.type === 'title' ? (
                                <div className="h-full flex flex-col justify-center text-slate-900">
                                   <div className="w-24 h-2.5 bg-indigo-600 mb-12 rounded-full" />
                                   <h1 className="text-8xl font-black leading-[0.85] tracking-tighter mb-8">{currentSlide.companyName || "Legal Case Analysis"}</h1>
                                   <p className="text-4xl font-bold text-indigo-600/60 tracking-tight leading-snug">{analysis.subtitle}</p>
                                   <div className="mt-20 flex items-center gap-4">
                                      <div className="h-px w-20 bg-slate-200" />
                                      <div className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Confidential Executive Dossier</div>
                                   </div>
                                </div>
                              ) : (
                                <div className="flex flex-col h-full text-slate-900">
                                   <div className="flex items-center justify-between mb-16">
                                      <h2 className="text-5xl font-black uppercase tracking-tighter border-l-[14px] border-indigo-600 pl-10 leading-none">{currentSlide.title}</h2>
                                      <div className="text-xs font-black text-slate-300 tracking-[0.5em] uppercase">PG {(activeIndex + 1).toString().padStart(2, '0')}</div>
                                   </div>
                                   <div className="flex-1 flex gap-20">
                                      <div className="flex-1 space-y-10">
                                         {currentSlide.points.map((p, i) => (
                                           <div key={i} className="flex gap-8 animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                              <div className="w-14 h-1 bg-indigo-200 mt-6 flex-shrink-0 rounded-full" />
                                              <p className="text-3xl font-semibold leading-[1.3] tracking-tight text-slate-800" style={{ color: p.color || 'inherit', fontWeight: p.bold ? 900 : 500 }}>{p.text}</p>
                                           </div>
                                         ))}
                                      </div>
                                      {currentSlide.imageUrl && (
                                        <div className="w-[500px] h-[520px] shrink-0 bg-slate-50 rounded-[3.5rem] overflow-hidden shadow-2xl border-[10px] border-white group/img">
                                          <img src={currentSlide.imageUrl} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000 ease-out" />
                                        </div>
                                      )}
                                   </div>
                                </div>
                              )}
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="absolute bottom-10 flex gap-4 bg-white/5 p-5 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-3xl z-30">
                      {analysis.slides.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setActiveIndex(i)} 
                          className={`h-2.5 transition-all rounded-full ${activeIndex === i ? 'bg-indigo-500 w-16' : 'bg-white/10 hover:bg-white/30 w-2.5'}`} 
                          title={`Go to slide ${i+1}`}
                        />
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-sm transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl ${isDarkMode ? 'bg-red-500/10 text-red-400 shadow-red-900/20' : 'bg-red-50 text-red-500 shadow-red-100'}`}>
               <AlertCircle size={48} />
            </div>
            <h2 className={`text-4xl font-black mb-4 tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analysis Interrupted</h2>
            <p className={`max-w-md mb-10 font-medium transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{error || "An unexpected error occurred. This might be due to a complex legal structure that needs manual review."}</p>
            <button onClick={reset} className={`px-12 py-5 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl ${isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>Try Again</button>
          </div>
        )}

        {/* Demo Modal */}
        {isDemoOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <button 
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors z-[1001]"
            >
              <X size={32} />
            </button>

            <div className="relative w-full max-w-6xl aspect-video flex items-center justify-center px-20">
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900">
                <img 
                  src={demoImages[currentDemoIndex]} 
                  alt={`Demo ${currentDemoIndex + 1}`}
                  className="w-full h-full object-contain animate-in zoom-in-95 duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/demo${currentDemoIndex + 1}/1920/1080?text=Please+Upload+Demo+${currentDemoIndex + 1}`;
                  }}
                />
              </div>

              {/* Navigation Arrows */}
              <div className="absolute bottom-[-80px] left-0 right-0 flex items-center justify-center gap-12">
                <button 
                  onClick={() => setCurrentDemoIndex(prev => (prev > 0 ? prev - 1 : demoImages.length - 1))}
                  className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                >
                  <ChevronLeft size={32} />
                </button>

                <div className="text-white/60 font-mono text-lg tracking-widest">
                  <span className="text-white font-bold">{currentDemoIndex + 1}</span> / {demoImages.length}
                </div>

                <button 
                  onClick={() => setCurrentDemoIndex(prev => (prev < demoImages.length - 1 ? prev + 1 : 0))}
                  className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
