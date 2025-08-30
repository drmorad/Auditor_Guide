
import React from 'react';
import { Document } from '../types';
import { XIcon } from './icons';

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
}

// In a larger app, this might live in a shared components directory.
const CategoryBadge: React.FC<{ category: Document['category'] }> = ({ category }) => {
  const colors = {
    SOP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HACCP: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Audit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Team File': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>{category}</span>;
};


export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
              aria-label="Close document details"
            >
              <XIcon className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 pr-8">{document.name}</h2>
            
            <div className="mb-4">
              <CategoryBadge category={document.category} />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

            <div>
              <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs mb-2">Document Content</h3>
              <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{document.content}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map(tag => (
                    <span key={tag} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-xs rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs mb-2">Modification History</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Last updated on <span className="font-medium text-slate-800 dark:text-slate-200">{document.lastModified}</span> by <span className="font-medium text-slate-800 dark:text-slate-200">{document.modifiedBy}</span>.
                </p>
              </div>

            </div>
        </div>
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end rounded-b-xl">
            <button 
              onClick={onClose} 
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
};