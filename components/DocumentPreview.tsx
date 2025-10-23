import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Document, Note } from '../types';
import { XIcon, ChatBubbleIcon, EditIcon } from './icons';

interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
  onUpdateDocument: (document: Document) => void;
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

const AddNoteTooltip: React.FC<{ top: number, left: number, onClick: (e: React.MouseEvent) => void }> = ({ top, left, onClick }) => (
    <div 
        className="absolute z-10 animate-fade-in-up"
        style={{ top: `${top}px`, left: `${left}px` }}
    >
        <button 
            onClick={onClick}
            className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1 rounded-md shadow-lg text-sm"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Note
        </button>
    </div>
);

const InlineNoteEditor: React.FC<{
  top: number;
  left: number;
  highlightedText: string;
  onSave: (noteContent: string) => void;
  onCancel: () => void;
}> = ({ top, left, highlightedText, onSave, onCancel }) => {
  const [noteContent, setNoteContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSaveClick = () => {
    if (noteContent.trim()) {
      onSave(noteContent);
    }
  };

  return (
    <div
      className="absolute z-20 animate-fade-in-up bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 w-72 border border-slate-200 dark:border-slate-700"
      style={{ top: `${top}px`, left: `${left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">Add note for:</p>
      <blockquote className="border-l-4 border-primary-400 pl-3 my-2 text-slate-700 dark:text-slate-300 italic text-sm">"{highlightedText}"</blockquote>
      <textarea
        ref={textareaRef}
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Type your note here..."
        className="w-full mt-2 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onCancel} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
        <button onClick={handleSaveClick} className="text-sm font-semibold text-white bg-primary-600 px-3 py-1 rounded-md hover:bg-primary-700">Save Note</button>
      </div>
    </div>
  );
};


export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose, onUpdateDocument, addAuditLog }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const tempHighlightRef = useRef<HTMLElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; top: number; left: number; text: string; }>({ visible: false, top: 0, left: 0, text: '' });
  const [noteEditorState, setNoteEditorState] = useState<{ top: number; left: number; text: string; } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content || '');
  
  const isNativeTextDocument = useMemo(() => document.type?.startsWith('text/') && !document.embedLink, [document]);

  useEffect(() => {
    setEditedContent(document.content || '');
    setIsEditing(false);
  }, [document]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => editTextareaRef.current?.focus(), 0);
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    setShowNotes(false);
    clearSelection();
    setNoteEditorState(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(document.content || '');
  };

  const handleSaveEdit = () => {
    if (editedContent === document.content) {
      setIsEditing(false);
      return;
    }

    const updatedDocument = {
      ...document,
      content: editedContent,
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: 'Current User',
    };

    onUpdateDocument(updatedDocument);
    addAuditLog('Document Content Edited', `Updated content for document: "${document.name}"`);
    setIsEditing(false);
  };


  const clearSelection = () => {
    if (tempHighlightRef.current) {
        const span = tempHighlightRef.current;
        const parent = span.parentNode;
        if (parent) {
            // Unwrap the span
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
        }
        tempHighlightRef.current = null;
    }
    setTooltip({ visible: false, top: 0, left: 0, text: '' });
  };

  useEffect(() => {
    // Cleanup temporary highlight on unmount
    return clearSelection;
  }, []);

  const handleMouseUp = () => {
    if (!isNativeTextDocument || !contentRef.current || noteEditorState) {
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selection) {
        clearSelection(); // Clear any previous temporary highlight

        const range = selection.getRangeAt(0);
        
        const span = window.document.createElement('span');
        span.className = 'bg-yellow-200 dark:bg-yellow-700/60 rounded';
        tempHighlightRef.current = span;

        try {
            range.surroundContents(span);
            
            const rect = span.getBoundingClientRect();
            const containerRect = contentRef.current.getBoundingClientRect();
    
            setTooltip({
                visible: true,
                top: rect.top - containerRect.top - 40,
                left: rect.left - containerRect.left + rect.width / 2 - 50,
                text: selectedText
            });
            selection.removeAllRanges(); 
        } catch(e) {
            console.warn("Could not highlight selection. It might span across multiple block elements.", e);
            clearSelection(); 
        }
    } else {
        if (tooltip.visible) {
            setTooltip({...tooltip, visible: false});
        }
    }
  };


  const handleAddNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteEditorState({
      top: tooltip.top,
      left: tooltip.left,
      text: tooltip.text,
    });
    setTooltip({ ...tooltip, visible: false });
  };
  
  const handleSaveNote = (noteContent: string) => {
    if (!noteEditorState) return;

    const newNote: Note = {
      id: new Date().toISOString(),
      content: noteContent,
      timestamp: new Date().toISOString(),
      highlightedText: noteEditorState.text,
    };
    
    const updatedDocument = {
      ...document,
      notes: [...(document.notes || []), newNote]
    };

    onUpdateDocument(updatedDocument);

    const highlightSnippet = noteEditorState.text.length > 30 
      ? `${noteEditorState.text.substring(0, 30)}...`
      : noteEditorState.text;
    addAuditLog('Note Added', `Added note to "${document.name}" for text: "${highlightSnippet}"`);
    
    clearSelection(); 
    setNoteEditorState(null);
    setShowNotes(true);
  };
  
  const handleCancelNote = () => {
    clearSelection();
    setNoteEditorState(null);
  };

  const renderHighlightedContent = useMemo(() => {
    if (!isNativeTextDocument || !document.content) return null;
    const content = document.content;
    const highlights = document.notes?.map(n => n.highlightedText) || [];
    
    if (!showNotes || highlights.length === 0) {
        return <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">{content}</pre>;
    }

    // FIX: Filter out any non-string or empty values from highlights to ensure type safety and prevent invalid regex patterns.
    const uniqueHighlights = [...new Set(highlights)].filter((h): h is string => typeof h === 'string' && h.length > 0);

    if (uniqueHighlights.length === 0) {
      return <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">{content}</pre>;
    }
    
    const regex = new RegExp(`(${uniqueHighlights.map(h => h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'g');
    const parts = content.split(regex);

    return (
        <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
            {parts.map((part, index) =>
                uniqueHighlights.includes(part) ? (
                    <mark key={index} className="bg-primary-200 dark:bg-primary-800/60 rounded px-1 py-0.5">
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                )
            )}
        </pre>
    );
  }, [document.content, document.notes, isNativeTextDocument, showNotes]);

  const renderContent = () => {
    const { embedLink, type, content, name } = document;

    if (embedLink) {
        return <iframe src={embedLink} className="w-full h-full min-h-[60vh] rounded-lg border-0" title={name}></iframe>;
    }
    
    if (isNativeTextDocument) {
        if (isEditing) {
          return (
            <textarea
              ref={editTextareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[60vh] p-2 bg-white dark:bg-slate-800 border-2 border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans text-slate-700 dark:text-slate-300"
              aria-label="Document content editor"
            />
          );
        }

        return (
            <div 
              ref={contentRef} 
              onMouseUp={handleMouseUp} 
              onClick={() => {
                clearSelection();
                if (noteEditorState) handleCancelNote();
              }}
              className="relative"
            >
                {tooltip.visible && <AddNoteTooltip top={tooltip.top} left={tooltip.left} onClick={handleAddNoteClick} />}
                {noteEditorState && (
                    <InlineNoteEditor
                        top={noteEditorState.top}
                        left={noteEditorState.left}
                        highlightedText={noteEditorState.text}
                        onSave={handleSaveNote}
                        onCancel={handleCancelNote}
                    />
                )}
                {renderHighlightedContent}
            </div>
        );
    }

    if (type?.startsWith('image/')) {
      return <img src={content} alt={name} className="max-w-full rounded-lg shadow-md mx-auto" />;
    }
    
    return (
      <div className="text-center p-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <p className="font-semibold text-lg">Preview not available for this file type.</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2">File type: {type}</p>
      </div>
    );
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl relative animate-fade-in-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="flex justify-between items-start pr-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{document.name}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
               {isNativeTextDocument && !isEditing && (
                <button
                    onClick={handleEditClick}
                    className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    aria-label="Edit document content"
                >
                    <EditIcon className="w-5 h-5" />
                    <span>Edit</span>
                </button>
               )}
              {isNativeTextDocument && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-pressed={showNotes}
                >
                  <ChatBubbleIcon className="w-5 h-5" />
                  <span>{showNotes ? 'Hide Notes' : 'Show Notes'}</span>
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {document.notes?.length || 0}
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mt-2">
              <div><span className="font-semibold text-slate-600 dark:text-slate-400">Category: </span><CategoryBadge category={document.category} /></div>
              {document.tags.length > 0 && <div className="flex items-center gap-2"><span className="font-semibold text-slate-600 dark:text-slate-400">Tags: </span><div className="flex flex-wrap gap-2">{document.tags.map(tag => (<span key={tag} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-xs rounded-full font-medium">{tag}</span>))}</div></div>}
              <div className="text-slate-500 dark:text-slate-500">Last Modified: <span className="font-medium text-slate-700 dark:text-slate-300">{document.lastModified}</span> by <span className="font-medium text-slate-700 dark:text-slate-300">{document.modifiedBy}</span></div>
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 flex-grow overflow-y-auto">
            <div className={`grid grid-cols-1 ${isNativeTextDocument && showNotes && !isEditing ? 'lg:grid-cols-3' : ''} gap-6`}>
              {/* Content Column */}
              <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 min-h-[300px] ${isNativeTextDocument && showNotes && !isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {renderContent()}
              </div>

              {/* Notes Column (conditional) */}
              {isNativeTextDocument && showNotes && !isEditing && (
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Notes & Highlights</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                      {(document.notes && document.notes.length > 0) ? (
                          [...document.notes].reverse().map(note => (
                              <div key={note.id} className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg animate-fade-in">
                                  <blockquote className="border-l-2 border-slate-400 pl-3 text-sm text-slate-600 dark:text-slate-400 italic">"{note.highlightedText}"</blockquote>
                                  <p className="mt-2 text-slate-800 dark:text-slate-200">{note.content}</p>
                              </div>
                          ))
                      ) : (
                          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                              Select text in the document to add a note.
                          </p>
                      )}
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end rounded-b-xl flex-shrink-0">
          {isEditing ? (
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editedContent === document.content}
                className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-400 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
