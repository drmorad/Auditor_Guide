import React, { useState, useRef, useMemo } from 'react';
import { Document, View, Sop, User } from '../types';
import { MagicIcon, SearchIcon, EditIcon, UploadIcon, DriveIcon, ExclamationTriangleIcon } from './icons';
import { EditDocumentModal } from './EditDocumentModal';
import { UploadPreviewModal } from './UploadPreviewModal';
import { DocumentPreview } from './DocumentPreview';
import { uploadFile } from '../services/googleDriveService';
import { generateSopFromDocument } from '../services/geminiService';
import { pickFile } from '../services/googleDrivePickerService';

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
  isDriveConnected: boolean;
  isConnecting: boolean;
  onConnectDrive: () => void;
  currentUser: User;
  isDriveConfigured: boolean;
  driveError: string | null;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ setView, addAuditLog, documents, setDocuments, onSopCreated, isDriveConnected, isConnecting, onConnectDrive, currentUser, isDriveConfigured, driveError }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Document['category']>('All');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<Document | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<{ file: File | null; name: string; content: string; type: string; } | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [isPickingFile, setIsPickingFile] = useState(false);
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
      doc.id === updatedDocument.id ? { ...updatedDocument, lastModified: new Date().toISOString().split('T')[0], modifiedBy: currentUser.name } : doc
    );
    setDocuments(newDocuments);
    addAuditLog('Document Edited', logDetails);
    setEditingDocument(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImportFromDrive = async () => {
    setIsPickingFile(true);
    try {
      addAuditLog('Action Initiated', 'Importing file from Google Drive.');
      const fileData = await pickFile();
      setUploadingDocument({
        file: null, // No real file object for imports
        name: fileData.name,
        content: fileData.content,
        type: fileData.mimeType,
      });
    } catch (error) {
      console.error("Drive import failed", error);
      // In a real app, show an error toast to the user
    } finally {
        setIsPickingFile(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadingDocument({ file, name: file.name, content, type: file.type });
      };

      if (file.type.startsWith('text/') || file.type === '' || file.type === 'application/pdf') {
         reader.readAsDataURL(file); // Reading as data URL for preview consistency in modal
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
    if (!uploadingDocument) return;

    setIsSavingUpload(true);
    try {
      if (uploadingDocument.file) { // It's a local upload, send to Drive
          const { id: driveId, embedLink } = await uploadFile(uploadingDocument.file);
          const newDocument: Document = {
              id: new Date().toISOString(),
              driveId,
              name: details.name,
              category: details.category,
              tags: details.tags,
              embedLink,
              type: uploadingDocument.type,
              lastModified: new Date().toISOString().split('T')[0],
              modifiedBy: currentUser.name,
              notes: [],
              organizationId: documents[0]?.organizationId || '',
          };
          setDocuments(prevDocs => [newDocument, ...prevDocs]);
          addAuditLog('Document Uploaded', `File: "${details.name}" to Google Drive`);
      } else { // It's a drive import, save its content directly
          const newDocument: Document = {
              id: new Date().toISOString(),
              name: details.name,
              category: details.category,
              tags: details.tags,
              content: uploadingDocument.content,
              type: uploadingDocument.type,
              lastModified: new Date().toISOString().split('T')[0],
              modifiedBy: currentUser.name,
              notes: [],
              organizationId: documents[0]?.organizationId || '',
          };
          setDocuments(prevDocs => [newDocument, ...prevDocs]);
          addAuditLog('Document Imported', `Imported from Drive: "${details.name}"`);
      }
      setUploadingDocument(null);
    } catch (error) {
        console.error("Save/Upload failed", error);
    } finally {
        setIsSavingUpload(false);
    }
  };
  
  const renderDriveButtons = () => {
    if (driveError) {
      return (
        <div className="relative group">
          <div className="flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-semibold py-2 px-4 rounded-lg w-full">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>Drive Unavailable</span>
          </div>
          <div className="absolute bottom-full mb-2 w-72 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {driveError}
          </div>
        </div>
      );
    }

    if (!isDriveConfigured) {
        return (
            <div className="relative group">
                <div className="flex items-center justify-center gap-2 bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 font-semibold py-2 px-4 rounded-lg w-56 cursor-not-allowed">
                    <DriveIcon className="w-5 h-5" />
                    <span>Drive Not Configured</span>
                </div>
                <div className="absolute bottom-full mb-2 w-72 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Google Drive integration is not available because API credentials are not set up by the administrator.
                </div>
            </div>
        );
    }

    if (!isDriveConnected) {
      return (
        <button 
          onClick={onConnectDrive}
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
                  <DriveIcon className="w-5 h-5" />
                  <span>Connect to Google Drive</span>
              </>
            )}
        </button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
         <button 
          onClick={handleImportFromDrive}
          disabled={isPickingFile}
          className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {isPickingFile ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div> : <DriveIcon className="w-5 h-5"/>}
          Import from Drive
        </button>
         <button 
          onClick={handleUploadClick}
          className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <UploadIcon className="w-5 h-5"/>
          Upload to Drive
        </button>
      </div>
    );
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
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
                accept="image/png, image/jpeg, .pdf, .txt, text/plain"
              />
              {renderDriveButtons()}
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
                <th className="p-4"></th>
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