import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between py-6 px-4 md:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Gemini Style Transformer
          </h1>
          <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash & 3 Pro</p>
        </div>
      </div>
    </header>
  );
};

export default Header;