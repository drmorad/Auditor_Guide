
import React, { useState } from 'react';
import { Document } from '../types';
import { XIcon } from './icons';

interface UploadPreviewModalProps {
  fileName: string;
  fileContent: string;
  fileType: string;
  onClose: () => void;
  onSave: (details: { name: string; category: Document['category']; tags: string[] }) => void;
  isSaving: boolean;
}

const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export const UploadPreviewModal: React.FC<UploadPreviewModalProps> = ({ fileName, fileContent, fileType, onClose, onSave, isSaving }) => {
  const [name, setName] = useState(fileName);
  const [category, setCategory] = useState<Document['category']>('Team File');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    onSave({
      name,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });
  };
  
  const renderPreview = () => {
    if (fileType.startsWith('image/')) {
        return <img src={fileContent} alt="Preview" className="max-w-full max-h-full object-contain mx-auto" />;
    }
    if (fileType === 'application/pdf') {
        return <iframe src={fileContent} title="PDF Preview" className="w-full h-full"></iframe>;
    }
    if (fileType.startsWith('text/')) {
        return <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm font-mono">{fileContent}</pre>;
    }
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <p className="font-semibold">No preview available</p>
            <p className="text-sm">File type: {fileType || 'unknown'}</p>
        </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
              aria-label="Close upload preview"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white pr-8">Preview and Confirm Upload</h2>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="doc-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Document Name
                    </label>
                    <input
                        id="doc-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                 <div>
                    <label htmlFor="doc-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Category
                    </label>
                    <select
                        id="doc-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Document['category'])}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="Team File">Team File</option>
                        <option value="SOP">SOP</option>
                        <option value="HACCP">HACCP</option>
                        <option value="Audit">Audit</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="doc-tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma-separated)
                </label>
                <input
                    id="doc-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
            </div>

            <div>
              <h3 className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs mb-2">File Content Preview</h3>
              <div className="h-60 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto">
                {renderPreview()}
              </div>
            </div>
        </div>

         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button 
              onClick={onClose} 
              disabled={isSaving}
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
             <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md flex items-center justify-center w-32 disabled:bg-primary-400"
            >
              {isSaving ? <LoadingSpinner /> : 'Save to Hub'}
            </button>
        </div>
      </div>
    </div>
  );
};
