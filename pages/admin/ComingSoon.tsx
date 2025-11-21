
import React from 'react';
import { Hammer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon: React.FC<{ title?: string }> = ({ title = "System Setting" }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-gray-100 dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 max-w-md w-full">
        <div className="bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Hammer size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          This module is currently under development and will be available in a future update.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
