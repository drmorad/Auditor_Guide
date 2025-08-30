import React, { useState, useRef, useMemo } from 'react';
import { Document, View } from '../types';
import { MagicIcon, SearchIcon, EditIcon, UploadIcon } from './icons';
import { EditDocumentModal } from './EditDocumentModal';
import { UploadPreviewModal } from './UploadPreviewModal';
import { DocumentPreview } from './DocumentPreview';
import { uploadFile } from '../services/googleDriveService';

const mockDocuments: Document[] = [
  { id: '7', name: 'HACCP - Day 4.pdf', category: 'Team File', tags: [], lastModified: '2025-08-29', modifiedBy: 'Current User', type: 'application/pdf', embedLink: 'https://drive.google.com/file/d/1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt/preview' },
  { id: '1', name: 'Hand Washing Procedure', category: 'SOP', tags: ['hygiene', 'staff'], lastModified: '2024-07-28', modifiedBy: 'Jane Doe', content: `Purpose: To ensure all staff follow a standardized procedure for hand washing to prevent cross-contamination.\n\nProcedure:\n1. Wet hands with running water.\n2. Apply soap and lather for at least 20 seconds, covering all surfaces.\n3. Rinse hands thoroughly under running water.\n4. Dry hands with a single-use towel.`, type: 'text/plain', notes: [] },
  { id: '2', name: 'Cold Storage Temperature Log', category: 'HACCP', tags: ['temperature', 'food safety'], lastModified: '2024-07-27', modifiedBy: 'John Smith', content: `This document is used to log the temperature of all cold storage units (refrigerators and freezers) three times daily. This is a critical control point for food safety.\n\nInstructions:\n- Record the temperature at 9 AM, 2 PM, and 8 PM.\n- If any temperature is outside the safe range (below 4°C for fridges, below -18°C for freezers), report to the manager immediately.`, type: 'text/plain', notes: [] },
  { id: '3', name: 'Q3 Internal Audit', category: 'Audit', tags: ['compliance', 'quarterly'], lastModified: '2024-07-25', modifiedBy: 'Admin', content: `Summary of Q3 Internal Audit Findings:\n\nOverall Score: 92%\n\nStrengths:\n- Excellent adherence to hand washing protocols.\n- Accurate and consistent temperature logging.\n\nAreas for Improvement:\n- Chemical storage needs better labeling.\n- One fire extinguisher was found to be past its inspection date.`, type: 'text/plain', notes: [] },
  { id: '4', name: 'Onboarding Checklist', category: 'Team File', tags: ['hr', 'new staff'], lastModified: '2024-07-20', modifiedBy: 'Jane Doe', content: `New Staff Onboarding Checklist:\n\n[ ] Complete HR paperwork.\n[ ] Issue uniform and name tag.\n[ ] Tour of the facility.\n[ ] Introduction to team members.\n[ ] Review of key SOPs (Hand Washing, Emergency Plan).\n[ ] Shadow a senior team member for one shift.`, type: 'text/plain', notes: [] },
  { id: '5', name: 'Emergency Evacuation Plan', category: 'SOP', tags: ['safety', 'emergency'], lastModified: '2024-07-15', modifiedBy: 'Admin', content: `In case of fire or other emergency requiring evacuation:\n\n1. Upon hearing the alarm, cease all work immediately.\n2. Proceed to the nearest marked exit.\n3. Do not use elevators.\n4. Assemble at the designated meeting point in the main parking lot.\n5. Await further instructions from the safety coordinator.`, type: 'text/plain', notes: [] },
  { id: '6', name: 'Kitchen Layout Diagram.png', category: 'Team File', tags: ['diagram', 'safety'], lastModified: '2024-07-12', modifiedBy: 'Jane Doe', content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNWRHWFIAAE4pSURBVHhe7d15VFTXvvDx+d2547pLDs/dZccwGhcTcxz33E1N99Rcc0zjvcvMVQc/zJ3cO1M33T090wM4GcFABkUURMFFFAEFsRBRQYosUAS7g+yA7O7sLrv/9ofAQQMzc3d+f2Am9fn+eN5n7j3nnvO9p/c5555n/Pnz58/v999/T7du3TpssQjV6tWrV1tYWFhfffWV/dSpU3bv3j38gQMH7JkzZ+xLL72037t3z+7fv2+/efOm/e677+zll19e+vHHH21xcbFdt25dwV27drVFixYt5YkTJ2y3bt3s+vXrKz/88IPdu3fP3rBhg923b59Vq1ZtbGtrY8ePH9/w+/fv2927d1d+/PFH+/LLL9vt27ft4cOH+/Dhg3327JnduXPHvvLKK/bll1+2jz/+uN2/f98+ffq0zZ8/v2zcuLFdu3ZNiYg/WlhYWBERESkiIqK4uLhK4uLiysrKyiY3N7c8PDzse/fucXgHBwft1NRUe/v2bXt5ebk9Pj5uN27cWBYWFvpPf4iIiGjevHnK0NBQu2/fPiUjI6OUlJSU7t27pxQVFZXu3r2rHD16tLx69WopKCgoRUdHVyIiIsqZM2fsqVOn7JkzZ+wJEyZoR0dHu2TJkv2MGTPssWPH7OPHj21paWnZunVrKygoaO3YsWM5cuSIfe3atQ1t27a1Xbt2tW+//ba1devWduHCBXtqaqpdsWJF2759e9u5c2fZtWtXe/bsmf3pT39qHTp0aPzxxx/thx9+aD///HP7/fffW/v27dsff/zR+vXXX9vWrVtbixYtavz+++9ty5YtbceOHa1169a19evXt/3796/x/Pnz8uDBg3bkyJFl586dJSUlpaSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKC-9gI/AAAAAAAAAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKC-9Ag/APYE2kDu7WDQAAAABJRU5erkJggg==', type: 'image/png', notes: [] },
];

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
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ setView, addAuditLog }) => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<Document | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<{ file: File; name: string; content: string; type: string; } | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

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

      if (file.type.startsWith('text/')) {
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
