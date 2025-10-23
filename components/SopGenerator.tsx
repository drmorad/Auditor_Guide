import React, { useState, useEffect, useRef } from 'react';
import { Sop, View, Document } from '../types';
import { generateSop, reviewSop } from '../services/geminiService';
import { MagicIcon, DocumentIcon, UploadIcon } from './icons';
import { SaveSopModal } from './SaveSopModal';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500 delay-200"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500 delay-400"></div>
    </div>
);

// A simple utility to convert markdown-like syntax to HTML
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<li>$1</li>') // List items
      .replace(/(\<li\>.*?\<\/li\>)/g, '<ul>$1</ul>') // Wrap lists
      .replace(/\<\/ul\>\n?\<ul\>/g, '') // Join adjacent lists
      .replace(/\n/g, '<br />'); // New lines
    
    return <div className="space-y-2" dangerouslySetInnerHTML={{ __html: html }} />;
};

const SopDisplay: React.FC<{ sop: Sop }> = ({ sop }) => {
    return (
        <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-inner animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 border-b pb-2 border-slate-200 dark:border-slate-700">{sop.title}</h2>
            
            {sop.purpose && (
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Purpose</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{sop.purpose}</p>
              </div>
            )}
            
            {sop.scope && (
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Scope</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{sop.scope}</p>
              </div>
            )}

            <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Procedure</h3>
                <ol className="mt-2 list-decimal list-inside space-y-3">
                    {sop.steps.map((step, index) => (
                        <li key={index} className="pl-2">
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">{step.title}</strong>
                            <p className="pl-4 mt-0.5 text-slate-600 dark:text-slate-400">{step.description}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
};

interface SopGeneratorProps {
  setView: (view: View) => void;
  addAuditLog: (action: string, details: string) => void;
  onSaveSop: (documentData: { name: string; category: Document['category']; tags: string[]; content: string; }) => void;
  initialData?: { topic: string; details: string; } | Sop | null;
  onClearInitialData: () => void;
}

export const SopGenerator: React.FC<SopGeneratorProps> = ({ setView, addAuditLog, onSaveSop, initialData, onClearInitialData }) => {
  const [mode, setMode] = useState<'generate' | 'review'>('generate');
  
  // State for "Generate" mode
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [generatedSop, setGeneratedSop] = useState<Sop | null>(null);
  
  // State for "Review" mode
  const [reviewText, setReviewText] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        setMode('generate'); // Force generate mode when coming from a template or document
        if ('steps' in initialData) { // If it's a full SOP object
            setGeneratedSop(initialData);
            setTopic(initialData.title);
            // Reconstruct details from SOP for display in textarea, if user wants to re-generate
            const detailsFromSop = `Purpose: ${initialData.purpose ? initialData.purpose + '\n' : ''}Scope: ${initialData.scope ? initialData.scope + '\n' : ''}Steps:\n${initialData.steps.map(s => `- ${s.title}: ${s.description}`).join('\n')}`;
            setDetails(detailsFromSop);
        } else if ('topic' in initialData) { // If it's a {topic, details} object
            setTopic(initialData.topic);
            setDetails(initialData.details);
            setGeneratedSop(null); // Clear any previous generated SOP
        }
    } else { // No initial data, reset form
        setTopic('');
        setDetails('');
        setGeneratedSop(null);
    }
    // Clear initialData in parent after consuming it
    onClearInitialData(); 
  }, [initialData, onClearInitialData]);

  const handleModeChange = (newMode: 'generate' | 'review') => {
    setMode(newMode);
    setError(null);
    setGeneratedSop(null);
    setReviewFeedback(null);
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please provide a topic for the SOP.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedSop(null);
    try {
      const result = await generateSop(topic, details);
      setGeneratedSop(result);
      addAuditLog('SOP Generated', `Topic: "${topic}"`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReview = async () => {
    if (!reviewText.trim()) {
        setError('Please paste or upload the SOP content to be reviewed.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null);
    try {
        const result = await reviewSop(reviewText);
        setReviewFeedback(result);
        addAuditLog('SOP Reviewed', `AI review performed on a custom SOP.`);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            setReviewText(e.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    } else if (file) {
        setError("Please upload a valid text file (.txt).");
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const formatSopContent = (sop: Sop): string => {
    let content = `Title: ${sop.title}\n\n`;
    if (sop.purpose) content += `Purpose: ${sop.purpose}\n\n`;
    if (sop.scope) content += `Scope: ${sop.scope}\n\n`;
    content += `Procedure:\n`;
    sop.steps.forEach((step, index) => {
        content += `${index + 1}. ${step.title}\n`;
        content += `   ${step.description}\n\n`;
    });
    return content.trim();
  };

  const handleSave = (saveDetails: { name: string; category: Document['category']; tags: string[] }) => {
    if (!generatedSop) return;
    const documentData = { ...saveDetails, content: formatSopContent(generatedSop) };
    onSaveSop(documentData);
    setIsSaveModalOpen(false);
  };
  
  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
        isActive
          ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent'
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView(View.SopTemplates)} className="text-slate-500 hover:text-primary-500 transition-colors" aria-label="Back to SOP Templates">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">AI SOP Assistant</h1>
      </div>
      
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6" role="tablist">
        <TabButton label="Generate New SOP" isActive={mode === 'generate'} onClick={() => handleModeChange('generate')} />
        <TabButton label="Review Existing SOP" isActive={mode === 'review'} onClick={() => handleModeChange('review')} />
      </div>

      {mode === 'generate' ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4" role="tabpanel" aria-labelledby="tab-generate">
            <div>
                <label htmlFor="sop-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SOP Topic</label>
                <input id="sop-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Cleaning and Sanitizing Food Contact Surfaces" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"/>
            </div>
            <div>
                <label htmlFor="sop-details" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Details (Optional)</label>
                <textarea id="sop-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="e.g., Mention specific chemicals used, frequency of cleaning, and verification steps." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"/>
            </div>
            <div className="flex justify-end">
                <button onClick={handleGenerate} disabled={isLoading} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-300 disabled:cursor-not-allowed">
                    {isLoading ? <LoadingSpinner /> : <MagicIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'Generating...' : 'Generate'}</span>
                </button>
            </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4" role="tabpanel" aria-labelledby="tab-review">
            <div>
                <label htmlFor="sop-review-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paste or Upload SOP Content</label>
                <textarea id="sop-review-text" value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={10} placeholder="Paste your SOP content here..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"/>
            </div>
            <div className="flex justify-between items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,text/plain" aria-label="Upload text file for SOP review"/>
                <button onClick={handleUploadClick} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
                    <UploadIcon className="w-5 h-5"/> Upload Text File
                </button>
                <button onClick={handleReview} disabled={isLoading} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-300 disabled:cursor-not-allowed">
                    {isLoading ? <LoadingSpinner /> : <MagicIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'Reviewing...' : 'Review with AI'}</span>
                </button>
            </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {mode === 'review' && reviewFeedback && !isLoading && (
        <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-inner animate-fade-in space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2 border-slate-200 dark:border-slate-700">Feedback & Suggestions</h2>
            <div className="text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
              <SimpleMarkdown text={reviewFeedback} />
            </div>
        </div>
      )}

      {mode === 'generate' && generatedSop && (
        <>
            <div className="mt-6 flex justify-end">
                <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md">
                    <DocumentIcon className="w-5 h-5"/>
                    Save to Document Hub
                </button>
            </div>
            <SopDisplay sop={generatedSop} />
        </>
      )}

      {isSaveModalOpen && generatedSop && (
        <SaveSopModal sop={generatedSop} onClose={() => setIsSaveModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
};