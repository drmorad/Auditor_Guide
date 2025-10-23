import React, { useState, useRef, useMemo } from 'react';
import { Document, View, Sop } from '../types';
import { MagicIcon, SearchIcon, EditIcon, UploadIcon } from './icons';
import { EditDocumentModal } from './EditDocumentModal';
import { UploadPreviewModal } from './UploadPreviewModal';
import { DocumentPreview } from './DocumentPreview';
import { uploadFile } from '../services/googleDriveService';
import { generateSopFromDocument } from '../services/geminiService';

const CategoryBadge: React.FC<{ category: Document['category'] }> = ({ category }) => {
  const colors = {
    SOP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HACCP: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Audit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Team File': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>{category}</span>;
};

interface DocumentManagerProps {
  setView: (view: View) => void;
  addAuditLog: (action: string, details: string) => void;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  onSopCreated: (sop: Sop) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ setView, addAuditLog, documents, setDocuments, onSopCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Document['category']>('All');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<Document | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<{ file: File; name: string; content: string; type: string; } | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const searchMatch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = selectedCategory === 'All' || doc.category === selectedCategory;
      const tagsMatch = selectedTags.size === 0 || Array.from(selectedTags).every(tag => doc.tags.includes(tag));
      return searchMatch && categoryMatch && tagsMatch;
    });
  }, [documents, searchQuery, selectedCategory, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prevTags => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };

  const handlePreviewDocument = (doc: Document) => {
    setPreviewingDocument(doc);
    addAuditLog('Document Viewed', `Viewed document: "${doc.name}"`);
  };
  
  const handleUpdateDocument = (updatedDoc: Document) => {
    const newDocuments = documents.map(doc => (doc.id === updatedDoc.id ? updatedDoc : doc));
    setDocuments(newDocuments);
    setPreviewingDocument(updatedDoc); // Keep the preview open with updated data
  };

  const handleEditClick = (doc: Document) => {
    setEditingDocument(doc);
  };

  const handleCloseEdit = () => {
    setEditingDocument(null);
  };
  
  const handleSaveEdit = (updatedDocument: Document) => {
    const originalDocument = documents.find(doc => doc.id === updatedDocument.id);
    if (!originalDocument) return;

    const changes: string[] = [];
    if (originalDocument.name !== updatedDocument.name) {
      changes.push('name');
    }
    if (originalDocument.category !== updatedDocument.category) {
      changes.push('category');
    }
    if (JSON.stringify(originalDocument.tags.sort()) !== JSON.stringify(updatedDocument.tags.sort())) {
      changes.push('tags');
    }

    let logDetails;
    if (changes.length > 0) {
      logDetails = `Updated ${changes.join(', ')} for document: "${updatedDocument.name}"`;
    } else {
      logDetails = `Saved document without changes: "${updatedDocument.name}"`;
    }
    
    const newDocuments = documents.map(doc =>
      doc.id === updatedDocument.id ? { ...updatedDocument, lastModified: new Date().toISOString().split('T')[0], modifiedBy: 'Current User' } : doc
    );
    setDocuments(newDocuments);
    addAuditLog('Document Edited', logDetails);
    setEditingDocument(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadingDocument({ file, name: file.name, content, type: file.type });
      };

      if (file.type.startsWith('text/') || file.type === '') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }

      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCloseUploadPreview = () => {
    setUploadingDocument(null);
  }
  
  const handleAnalyzeAndCreateSop = async (fileContent: string, mimeType: string) => {
    try {
        addAuditLog('AI Analysis Started', `Analyzing uploaded document to create SOP.`);
        const generatedSop = await generateSopFromDocument(fileContent, mimeType);
        onSopCreated(generatedSop);
        setUploadingDocument(null);
    } catch (error) {
        console.error("SOP Generation from document failed", error);
        // Here you would show a more user-friendly error in the modal itself
        addAuditLog('AI Analysis Failed', `Failed to generate SOP from document.`);
    }
  };

  const handleSaveUpload = async (details: { name: string; category: Document['category']; tags: string[] }) => {
    if (!uploadingDocument?.file) return;

    setIsSavingUpload(true);
    try {
        const { embedLink } = await uploadFile(uploadingDocument.file);
        
        const newDocument: Document = {
            id: new Date().toISOString(),
            name: details.name,
            category: details.category,
            tags: details.tags,
            embedLink,
            type: uploadingDocument.type,
            lastModified: new Date().toISOString().split('T')[0],
            modifiedBy: 'Current User',
            notes: [],
            organizationId: documents[0]?.organizationId || '', // Use the org ID from existing documents
        };

        setDocuments(prevDocs => [newDocument, ...prevDocs]);
        addAuditLog('Document Uploaded', `File: "${details.name}" to Google Drive`);
        setUploadingDocument(null);
    } catch (error) {
        console.error("Upload failed", error);
        // Here you would show an error message to the user
    } finally {
        setIsSavingUpload(false);
    }
  };

  const handleConnectDrive = () => {
    setIsConnecting(true);
    addAuditLog('Action Initiated', `Connecting to Google Drive.`);
    setTimeout(() => {
        setIsDriveConnected(true);
        setIsConnecting(false);
        addAuditLog('Integration Enabled', `Successfully connected to Google Drive.`);
    }, 1500);
  };

  const renderModals = () => (
    <>
      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
      {uploadingDocument && (
        <UploadPreviewModal
          fileName={uploadingDocument.name}
          fileContent={uploadingDocument.content}
          fileType={uploadingDocument.type}
          onClose={handleCloseUploadPreview}
          onSave={handleSaveUpload}
          onAnalyze={handleAnalyzeAndCreateSop}
          isSaving={isSavingUpload}
        />
      )}
      {previewingDocument && (
        <DocumentPreview
          document={previewingDocument}
          onClose={() => setPreviewingDocument(null)}
          onUpdateDocument={handleUpdateDocument}
          addAuditLog={addAuditLog}
        />
      )}
    </>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Document Hub</h1>
          <div className="flex flex-wrap gap-2">
              {isDriveConnected ? (
                <>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                    accept="image/png, image/jpeg, .pdf, .txt, text/plain"
                  />
                  <button 
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <UploadIcon className="w-5 h-5"/>
                    Upload to Drive
                  </button>
                </>
              ) : (
                  <button 
                    onClick={handleConnectDrive}
                    disabled={isConnecting}
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-wait w-56"
                  >
                      {isConnecting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.925 9.094c-.225-.525-.525-.975-.9-1.35L13.5 2.219l-6 10.35 4.5 7.875 7.05-4.05c.45-.9.825-1.875.875-2.85zm-7.05-4.05l3.45 6-3.45 6-6-3.45-3.45-6 6-3.45z"></path></svg>
                            <span>Connect to Google Drive</span>
                        </>
                      )}
                  </button>
              )}
              <button onClick={() => setView(View.SopTemplates)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
                  <MagicIcon className="w-5 h-5"/>
                  Generate SOP with AI
              </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
          <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                  {(['All', 'SOP', 'HACCP', 'Audit', 'Team File'] as const).map(cat => (
                      <button 
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
          {allTags.length > 0 && (
              <div>
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
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Category</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Tags</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Last Modified</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      <button onClick={() => handlePreviewDocument(doc)} className="text-left hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors">
                        {doc.name}
                      </button>
                    </td>
                    <td className="p-4"><CategoryBadge category={doc.category} /></td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex gap-1">
                        {doc.tags.map(tag => <span key={tag} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs rounded">{tag}</span>)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        <div>{doc.lastModified}</div>
                        <div className="text-xs">{doc.modifiedBy}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(doc)} className="p-1 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label={`Edit ${doc.name}`}>
                            <EditIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => handlePreviewDocument(doc)} className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-800/50 text-primary-600 dark:text-primary-300 text-xs font-semibold py-1 px-3 rounded-md transition-colors">View</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-400">
                        No documents found matching your search.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderModals()}
    </>
  );
};