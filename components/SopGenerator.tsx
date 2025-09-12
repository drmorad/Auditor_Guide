import React, { useState, useEffect } from 'react';
import { Sop, View, Document } from '../types';
import { generateSop } from '../services/geminiService';
import { MagicIcon, DocumentIcon } from './icons';
import { SaveSopModal } from './SaveSopModal';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500 delay-200"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary-500 delay-400"></div>
    </div>
);


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
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [generatedSop, setGeneratedSop] = useState<Sop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
        // Check if it's a full Sop object
        if ('steps' in initialData) {
            setGeneratedSop(initialData);
            setTopic(initialData.title);
            // Reconstruct details from the SOP for potential re-generation
            const detailsFromSop = `Purpose: ${initialData.purpose}\nScope: ${initialData.scope}\nSteps:\n${initialData.steps.map(s => `- ${s.title}: ${s.description}`).join('\n')}`;
            setDetails(detailsFromSop);
        } 
        // Check if it's the simple {topic, details} object
        else if ('topic' in initialData) {
            setTopic(initialData.topic);
            setDetails(initialData.details);
            setGeneratedSop(null); // Clear any previous SOP
        }
    } else {
        // Clear everything if initialData is null/undefined
        setTopic('');
        setDetails('');
        setGeneratedSop(null);
    }

    // Cleanup function to clear the initial data in App.tsx when the component is unmounted
    return () => {
        onClearInitialData();
    };
}, [initialData, onClearInitialData]);


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

    const documentData = {
      ...saveDetails,
      content: formatSopContent(generatedSop),
    };

    onSaveSop(documentData);
    setIsSaveModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView(View.SopTemplates)} className="text-slate-500 hover:text-primary-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">AI SOP Generator</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4">
        <div>
          <label htmlFor="sop-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            SOP Topic
          </label>
          <input
            id="sop-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Cleaning and Sanitizing Food Contact Surfaces"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="sop-details" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Key Details (Optional)
          </label>
          <textarea
            id="sop-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="e.g., Mention specific chemicals used, frequency of cleaning, and verification steps."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-300 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner /> : <MagicIcon className="w-5 h-5" />}
            <span>{isLoading ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {generatedSop && (
        <>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
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