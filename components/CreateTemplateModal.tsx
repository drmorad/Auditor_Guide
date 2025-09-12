import React, { useState } from 'react';
import { InspectionTemplate, InspectionQuestion } from '../types';
import { XIcon, PlusCircleIcon, TrashIcon } from './icons';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSave: (template: InspectionTemplate) => void;
}

type QuestionDraft = Omit<InspectionQuestion, 'id'>;

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: '', guidance: '' },
  ]);
  const [error, setError] = useState('');

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
              <input
                id="template-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Bars, Housekeeping, Receiving"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 pt-2">Questions</h3>
          <div className="space-y-3">
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
            <button onClick={addQuestion} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
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