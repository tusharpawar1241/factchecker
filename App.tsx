import React from 'react';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex flex-col h-[90vh] sm:h-[85vh]">
        <header className="bg-gray-800 text-white p-4 rounded-t-lg shadow-md">
          <h1 className="text-2xl font-bold text-center">Veritas AI Fact-Checker</h1>
          <p className="text-sm text-center text-gray-300">Your skeptical conversational fact-checking assistant</p>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default App;