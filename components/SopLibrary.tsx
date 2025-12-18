

import React, { useState, useMemo } from 'react';
import { Document, View } from '../types';
import { MagicIcon, SearchIcon } from './icons';
import { DocumentPreview } from './DocumentPreview';

interface SopLibraryProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setView: (view: View) => void;
  addAuditLog: (action: string, details: string) => void;
}

const CategoryBadge: React.FC<{ category: Document['category'] }> = ({ category }) => {
  const colors = {
    SOP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HACCP: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Audit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Team File': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>{category}</span>;
};

export const SopLibrary: React.FC<SopLibraryProps> = ({ documents, setDocuments, setView, addAuditLog }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [previewingDoc, setPreviewingDoc] = useState<Document | null>(null);

  const sopDocuments = useMemo(() => documents.filter(doc => doc.category === 'SOP'), [documents]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    sopDocuments.forEach(doc => {
      doc.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [sopDocuments]);

  const filteredSops = useMemo(() => {
    return sopDocuments.filter(doc => {
      const searchMatch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const tagsMatch = selectedTags.size === 0 || Array.from(selectedTags).every(tag => doc.tags.includes(tag));
      return searchMatch && tagsMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [sopDocuments, searchQuery, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prevTags => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) newTags.delete(tag);
      else newTags.add(tag);
      return newTags;
    });
  };

  const handlePreview = (doc: Document) => {
    setPreviewingDoc(doc);
    addAuditLog('SOP Viewed', `Viewed SOP from library: "${doc.name}"`);
  };

  const handleUpdateDocument = (updatedDoc: Document) => {
    setDocuments(currentDocs => currentDocs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    setPreviewingDoc(updatedDoc); // Keep preview open with new data
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">SOP Library</h1>
          <button onClick={() => setView(View.SopTemplates)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
            <MagicIcon className="w-5 h-5"/>
            Create New SOP
          </button>
        </div>
        
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search SOPs by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Filter by Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors border ${selectedTags.has(tag) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Category</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Tags</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Last Modified</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSops.length > 0 ? (
                filteredSops.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      <button onClick={() => handlePreview(doc)} className="text-left hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors">
                        {doc.name}
                      </button>
                    </td>
                    <td className="p-4"><CategoryBadge category={doc.category} /></td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map(tag => <span key={tag} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs rounded">{tag}</span>)}
                        {doc.tags.length > 3 && <span className="text-xs text-slate-400 self-center">+{doc.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        <div>{doc.lastModified}</div>
                        <div className="text-xs">{doc.modifiedBy}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handlePreview(doc)} className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-800/50 text-primary-600 dark:text-primary-300 text-xs font-semibold py-1 px-3 rounded-md transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-400">
                        No SOPs found matching your search.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewingDoc && (
        <DocumentPreview
          document={previewingDoc}
          onClose={() => setPreviewingDoc(null)}
          onUpdateDocument={handleUpdateDocument}
          addAuditLog={addAuditLog}
        />
      )}
    </>
  );
};