import React, { useState, useEffect, useRef } from 'react';
import { runResearchAgent, getApiKeys } from '../services/research';
import SettingsModal from './SettingsModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResearchDashboard: React.FC = () => {
  const [headline, setHeadline] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<{ truthScore: number; summary: string; links: string[] } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check keys on mount
  useEffect(() => {
    const keys = getApiKeys();
    if (!keys.gemini || !keys.tavily) {
      setErrorToast("Missing required API Keys (Gemini & Tavily). Please configure them.");
    }
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    const keys = getApiKeys();
    if (!keys.gemini || !keys.tavily) {
      setErrorToast("Cannot start research: Missing API keys.");
      setIsSettingsOpen(true);
      return;
    }

    setIsResearching(true);
    setVerdict(null);
    setLogs([]);
    setErrorToast(null);

    try {
      const result = await runResearchAgent(headline, (msg) => {
        setLogs(prev => [...prev, msg]);
      });
      setVerdict(result);
    } catch (err: any) {
      console.error(err);
      setErrorToast(err.message || "An error occurred during research.");
      setLogs(prev => [...prev, "❌ Error: " + (err.message || "Unknown error")]);
    } finally {
      setIsResearching(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!verdict) return;

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(63, 81, 181); // Indigo
    doc.text("Verifai Research Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${timestamp}`, 14, 28);

    // Headline
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Headline Checked:", 14, 40);
    doc.setFont("helvetica", "normal");
    const headlineLines = doc.splitTextToSize(headline, 180);
    doc.text(headlineLines, 14, 47);

    let currentY = 47 + (headlineLines.length * 7);

    // Truth Score
    doc.setFont("helvetica", "bold");
    doc.text("Truth Score:", 14, currentY + 10);
    doc.setFontSize(24);
    const scoreColor = verdict.truthScore >= 75 ? [34, 197, 94] : verdict.truthScore >= 40 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${verdict.truthScore}%`, 14, currentY + 22);

    currentY += 30;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Research Summary:", 14, currentY);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(verdict.summary, 180);
    doc.text(summaryLines, 14, currentY + 7);

    currentY += 7 + (summaryLines.length * 6) + 10;

    // Sources Table
    if (verdict.links.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Sources Cited:", 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['#', 'Source URL']],
        body: verdict.links.map((link, i) => [i + 1, link]),
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 9, overflow: 'linebreak' },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 170 } }
      });
    }

    doc.save(`Verifai_Report_${headline.slice(0, 20).replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verifai Deep Research</h1>
          <p className="text-sm text-gray-500">Autonomous Fact-Checking Agent</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="Configure API Keys"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </header>

      {errorToast && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-6 shadow-sm rounded flex justify-between items-center">
          <p className="font-medium">{errorToast}</p>
          <button onClick={() => { setErrorToast(null); setIsSettingsOpen(true); }} className="text-sm underline hover:text-red-900">Configure Keys</button>
        </div>
      )}

      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Column: Input and Thinking Log */}
        <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleResearch} className="p-6 border-b border-gray-100 bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Headline / Claim to Verify</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                placeholder="e.g. AI models are getting worse at math..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={isResearching}
              />
              <button 
                type="submit" 
                disabled={isResearching || !headline.trim()}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-2"
              >
                {isResearching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Researching...
                  </>
                ) : 'Deep Research'}
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-900 text-gray-300 font-mono text-sm leading-relaxed custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic h-full flex items-center justify-center">
                Agent is idle. Awaiting research task.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-green-400 shrink-0">➜</span>
                    <span className={log.includes('Failed') || log.includes('Error') ? 'text-red-400' : 'text-gray-200'}>{log}</span>
                  </div>
                ))}
                {isResearching && (
                  <div className="flex gap-3 animate-pulse">
                    <span className="text-indigo-400 shrink-0">➜</span>
                    <span className="text-indigo-300">...</span>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verdict */}
        <div className="w-full lg:w-1/3 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Final Verdict</h2>
            {verdict && (
              <button 
                onClick={handleDownloadPDF}
                className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                PDF
              </button>
            )}
          </div>
          
          <div className="p-6 flex-1 bg-gray-50">
            {!verdict && !isResearching && (
              <div className="text-center text-gray-500 mt-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p>Run a research task to see the verdict.</p>
              </div>
            )}
            
            {isResearching && (
              <div className="text-center text-gray-500 mt-10 animate-pulse">
                <p>Synthesizing research...</p>
              </div>
            )}

            {verdict && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Truth Score</div>
                  <div className={`text-5xl font-black ${verdict.truthScore >= 75 ? 'text-green-500' : verdict.truthScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {verdict.truthScore}%
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</div>
                  <p className="text-gray-800 leading-relaxed text-sm">
                    {verdict.summary}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sources Cited</div>
                  {verdict.links.length > 0 ? (
                    <ul className="space-y-2">
                      {verdict.links.map((link, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-5 h-5 text-indigo-500 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 truncate" title={link}>
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No external sources cited.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default ResearchDashboard;
