
import React from 'react';
import { CaseAnalysis } from '../types';
import { FileDown, ChevronRight, Presentation } from 'lucide-react';

interface AnalysisViewProps {
  analysis: CaseAnalysis;
  onDownload: () => void;
  onReset: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onDownload, onReset }) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{analysis.presentationTitle}</h1>
          <p className="text-lg text-slate-500">{analysis.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Start New Analysis
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <FileDown size={20} />
            Download PPTX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysis.slides.map((slide, index) => (
          <div key={index} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-800 p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slide {index + 1}</span>
              <Presentation size={14} className="text-slate-500" />
            </div>
            <div className="p-5 h-64 overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{slide.title}</h3>
              <ul className="space-y-2">
                {slide.points.map((point, pIndex) => (
                  <li key={pIndex} className="flex items-start gap-2 text-sm text-slate-600">
                    <ChevronRight size={14} className="mt-1 flex-shrink-0 text-indigo-400" />
                    {/* Fix: Render point.text instead of the whole StyledPoint object */}
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};
