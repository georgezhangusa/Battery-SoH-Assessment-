import React, { useState } from 'react';
import {
  FileText,
  X,
  Mail,
  Linkedin,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Info,
  Code,
  BookOpen,
} from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  if (!isOpen) return null;

  const rawMarkdownContent = `AI-driven interactive assessment of battery pack state-of-health (SoH), using AI to model capacity-fade trajectories and cycle-life degradation, to optimize multi-year battery energy storage system (BESS) augmentation schedules and their financial impacts.

Note: This is a conceptual demo. If you believe it could become a useful application, we can collaborate to make it a reality.
Please get in touch with the author, George Zhang, by email: z_george@yahoo.com or reach me on LinkedIn: georgezhangusa`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('z_george@yahoo.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative border-b border-indigo-900/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs active:translate-y-0.5"
            aria-label="Close README modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md border border-indigo-400/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>README</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 bg-indigo-900/80 text-indigo-300 rounded border border-indigo-700">
                    README.md
                  </span>
                </h2>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                BESS Battery Health (SOH) Interactive Assessment System
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Main Statement Box */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-indigo-100 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            <div className="flex items-start gap-3 pl-1">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1.5">
                  Core Mission & System Functionality
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  AI-driven interactive assessment of battery pack state-of-health (SoH), using AI
                  to model capacity-fade trajectories and cycle-life degradation, to optimize
                  multi-year battery energy storage system (BESS) augmentation schedules and their
                  financial impacts.
                </p>
              </div>
            </div>
          </div>

          {/* Conceptual Demo Callout */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold text-amber-950">Note: </span>
                This is a conceptual demo. If you believe it could become a useful application, we
                can collaborate to make it a reality.
              </div>
            </div>
          </div>

          {/* Author Contact & Collaboration Cards */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Author & Collaboration Inquiries
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate">
                      z_george@yahoo.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="mailto:z_george@yahoo.com"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border-t border-t-blue-300/40 border-x border-blue-600 border-b-[3px] border-b-blue-900 shadow-[0_2px_0_0_#1e3a8a] active:translate-y-[2px] active:border-b-[1px] active:shadow-none transition-all cursor-pointer select-none"
                  >
                    <span>Send Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center justify-center p-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border-t border-t-white border-x border-slate-300 border-b-[3px] border-b-slate-400 shadow-[0_2px_0_0_#94a3b8] active:translate-y-[2px] active:border-b-[1px] active:shadow-none transition-all cursor-pointer select-none"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span className="text-[11px] ml-1">
                      {copiedEmail ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>

              {/* LinkedIn Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      LinkedIn
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate">
                      georgezhangusa
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href="https://www.linkedin.com/in/georgezhangusa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0A66C2] hover:bg-[#004182] text-white border-t border-t-sky-300/40 border-x border-[#0A66C2] border-b-[3px] border-b-[#00274c] shadow-[0_2px_0_0_#00274c] active:translate-y-[2px] active:border-b-[1px] active:shadow-none transition-all cursor-pointer select-none"
                  >
                    <span>Connect on LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-sky-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Raw Markdown Preview */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>{showRawMarkdown ? 'Hide Raw README.md' : 'View Raw README.md File'}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {showRawMarkdown ? '▲ collapse' : '▼ expand'}
              </span>
            </button>

            {showRawMarkdown && (
              <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border-t border-slate-200">
                <pre className="whitespace-pre-wrap">{rawMarkdownContent}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border-t border-t-slate-700 border-x border-slate-900 border-b-[3px] border-b-slate-950 shadow-[0_3px_0_0_#020617] active:translate-y-[2px] active:border-b-[1px] active:shadow-none transition-all cursor-pointer select-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
