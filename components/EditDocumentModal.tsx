import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { XIcon } from './icons';

interface EditDocumentModalProps {
  document: Document;
  onClose: () => void;
  onSave: (document: Document) => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ document, onClose, onSave }) => {
  const [name, setName] = useState(document.name);
  const [category, setCategory] = useState<Document['category']>(document.category);
  const [tags, setTags] = useState(document.tags.join(', '));

  useEffect(() => {
    setName(document.name);
    setCategory(document.category);
    setTags(document.tags.join(', '));
  }, [document]);

  const handleSave = () => {
    const updatedDocument: Document = {
      ...document,
      name,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    onSave(updatedDocument);
  };

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
              aria-label="Close edit modal"
            >
              <XIcon className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 pr-8">Edit Document</h2>
            
            <div className="space-y-4">
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
                        <option value="SOP">SOP</option>
                        <option value="HACCP">HACCP</option>
                        <option value="Audit">Audit</option>
                        <option value="Team File">Team File</option>
                    </select>
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
            </div>
        </div>
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button 
              onClick={onClose} 
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
             <button 
              onClick={handleSave} 
              className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};
