import React, { useState } from 'react';
import { InspectionTemplate, InspectionQuestion } from '../types';
import { XIcon, PlusCircleIcon, TrashIcon, MagicIcon } from './icons';
import { generateChecklistFromSop } from '../services/geminiService';
import { pickFile } from '../services/googleDrivePickerService';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSave: (template: InspectionTemplate) => void;
  departments: string[];
  isDriveConnected: boolean;
  isConnecting: boolean;
  onConnectDrive: () => void;
}

type QuestionDraft = Omit<InspectionQuestion, 'id'>;

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onSave, departments, isDriveConnected, isConnecting, onConnectDrive }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(departments[0] || '');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: '', guidance: '' },
  ]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleQuestionChange = (index: number, field: 'text' | 'guidance', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', guidance: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return; // Always keep at least one question
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleGenerateFromText = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      setError('');
      try {
          const generatedQuestions = await generateChecklistFromSop(aiPrompt);
          if (questions.length === 1 && !questions[0].text) {
              setQuestions(generatedQuestions);
          } else {
              setQuestions(prev => [...prev, ...generatedQuestions]);
          }
          setAiPrompt('');
      } catch (e) {
          setError('Failed to generate checklist. Please try again.');
      } finally {
          setIsGenerating(false);
      }
  };
  
  const handleImportAndGenerate = async () => {
    if (!isDriveConnected) {
      onConnectDrive();
      return;
    }
    
    setIsGenerating(true);
    setError('');
    try {
        const fileData = await pickFile();
        const generatedQuestions = await generateChecklistFromSop(fileData.content);
        if (questions.length === 1 && !questions[0].text) {
            setQuestions(generatedQuestions);
        } else {
            setQuestions(prev => [...prev, ...generatedQuestions]);
        }
    } catch (e) {
        setError('Failed to generate checklist from Drive file.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setError('');
    if (!name.trim() || !department.trim()) {
      setError('Template name and department are required.');
      return;
    }
    if (questions.some(q => !q.text.trim())) {
      setError('All question fields must be filled out.');
      return;
    }

    const newTemplate: InspectionTemplate = {
      id: `template-${Date.now()}`,
      name,
      department,
      questions: questions.map((q, index) => ({
        ...q,
        id: `q-${Date.now()}-${index}`,
      })),
    };
    onSave(newTemplate);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full">
            <XIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Inspection Template</h2>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template Name</label>
              <input
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lobby Bar Opening Checklist"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label htmlFor="template-dept" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select
                id="template-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              >
                  {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                  ))}
              </select>
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Checklist Generator</h3>
             <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-800 mt-2 space-y-3">
                  <label className="block text-sm font-medium text-primary-900 dark:text-primary-100">
                      Enter an SOP or Topic to generate a checklist from:
                  </label>
                  <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Paste the 'Hand Washing SOP' text here, or simply type 'Closing duties for front desk'."
                      className="w-full p-2 border border-primary-200 dark:border-primary-700 rounded-md bg-white dark:bg-slate-800 text-sm"
                      rows={3}
                  />
                  <div className="flex justify-end gap-2 flex-wrap">
                      <button 
                        onClick={handleGenerateFromText} 
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="bg-white text-primary-700 border border-primary-300 text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-primary-100 disabled:opacity-50"
                      >
                          {isGenerating ? 'Generating...' : 'Generate from Text'}
                      </button>
                      
                       {isDriveConnected ? (
                        <button onClick={handleImportAndGenerate} disabled={isGenerating} className="bg-primary-600 text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>
                           Import from Drive
                        </button>
                      ) : (
                        <button onClick={onConnectDrive} disabled={isConnecting} className="bg-blue-500 text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                           {isConnecting ? 'Connecting...' : 'Connect Drive to Import'}
                        </button>
                      )}
                  </div>
              </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 pt-2">Questions</h3>
            <div className="space-y-3 mt-2">
                {questions.map((q, index) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-3">
                    <span className="font-bold text-slate-500 dark:text-slate-400 pt-2">{index + 1}.</span>
                    <div className="flex-grow space-y-2">
                       <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                        placeholder="Enter question text..."
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                      />
                       <input
                        type="text"
                        value={q.guidance}
                        onChange={(e) => handleQuestionChange(index, 'guidance', e.target.value)}
                        placeholder="Optional: Enter guidance for the auditor..."
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      disabled={questions.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
            </div>
            <button onClick={addQuestion} className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
              <PlusCircleIcon className="w-5 h-5"/>
              Add Another Question
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
};