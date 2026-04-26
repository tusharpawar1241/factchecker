import React, { useState, useEffect } from 'react';
import { getApiKeys } from '../services/research';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [gemini, setGemini] = useState('');
  const [tavily, setTavily] = useState('');
  const [jina, setJina] = useState('');

  useEffect(() => {
    const keys = getApiKeys();
    setGemini(keys.gemini);
    setTavily(keys.tavily);
    setJina(keys.jina);
  }, [isOpen]);

  const handleSave = () => {
    if (gemini) localStorage.setItem('GEMINI_API_KEY', gemini);
    if (tavily) localStorage.setItem('TAVILY_API_KEY', tavily);
    if (jina) localStorage.setItem('JINA_API_KEY', jina);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">API Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please provide your API keys to use the Verifai Deep Research agent.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
            <input type="password" value={gemini} onChange={e => setGemini(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="AI Studio Key" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tavily API Key</label>
            <input type="password" value={tavily} onChange={e => setTavily(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="tvly-..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jina API Key (Optional)</label>
            <input type="password" value={jina} onChange={e => setJina(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="jina_..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">Save Keys</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
