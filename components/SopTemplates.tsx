
import React, { useState } from 'react';
import { SopTemplate, View, SopTemplateCategory } from '../types';
import { DocumentIcon, MagicIcon } from './icons';

const mockTemplates: SopTemplate[] = [
  {
    id: 'template-1',
    title: 'Hand Washing Procedure',
    description: 'A standard template for ensuring proper hand hygiene to prevent cross-contamination in food handling environments.',
    details: 'Covers steps for washing hands, when to wash hands, and supplies needed. For all food service and healthcare staff.',
    category: 'Food Safety',
  },
  {
    id: 'template-2',
    title: 'Receiving and Storing Food',
    description: 'Guidelines for safely receiving food deliveries and storing them at correct temperatures to maintain quality and safety.',
    details: 'Includes checking delivery vehicle cleanliness, verifying temperatures of refrigerated and frozen items, and first-in, first-out (FIFO) storage principles.',
    category: 'Food Safety',
  },
  {
    id: 'template-3',
    title: 'Cleaning and Sanitizing Surfaces',
    description: 'A procedure for the daily cleaning and sanitization of all food contact surfaces, equipment, and high-touch areas.',
    details: 'Specify the 3-step cleaning process (wash, rinse, sanitize), the approved chemical sanitizers, their correct concentrations, and contact times.',
    category: 'Food Safety',
  },
  {
    id: 'template-4',
    title: 'Emergency Action Plan',
    description: 'A general template for responding to common emergencies like fires, power outages, or medical incidents in the workplace.',
    details: 'Include evacuation routes, emergency contact numbers, location of fire extinguishers, and roles of key personnel during an emergency.',
    category: 'Health & Safety',
  },
  {
    id: 'template-5',
    title: 'Hazardous Material Handling',
    description: 'A procedure for safely handling, storing, and disposing of hazardous materials to ensure staff safety and compliance.',
    details: 'Include requirements for Personal Protective Equipment (PPE), location of Safety Data Sheets (SDS), and spill clean-up procedures.',
    category: 'Health & Safety',
  },
   {
    id: 'template-6',
    title: 'Customer Complaint Resolution',
    description: 'A standardized process for receiving, documenting, and resolving customer complaints to ensure satisfaction and quality control.',
    details: 'Outline steps for logging complaints, escalating issues, communicating with the customer, and implementing corrective actions.',
    category: 'Operations',
  },
  {
    id: 'template-7',
    title: 'New Employee Onboarding',
    description: 'A checklist and procedure for successfully onboarding new team members to ensure they are well-integrated and trained.',
    details: 'Includes HR paperwork, facility tour, introductions, and review of key company policies and SOPs.',
    category: 'HR',
  },
];

const categories: SopTemplateCategory[] = ['Food Safety', 'Health & Safety', 'Operations', 'HR'];

const CategoryBadge: React.FC<{ category: SopTemplateCategory }> = ({ category }) => {
  const colors: Record<SopTemplateCategory, string> = {
    'Food Safety': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Health & Safety': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Operations': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'HR': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>{category}</span>;
};


interface SopTemplatesProps {
  onSelectTemplate: (template: SopTemplate) => void;
  onStartFromScratch: () => void;
  setView: (view: View) => void;
}

export const SopTemplates: React.FC<SopTemplatesProps> = ({ onSelectTemplate, onStartFromScratch, setView }) => {
  const [selectedCategory, setSelectedCategory] = useState<SopTemplateCategory | 'All'>('All');

  const filteredTemplates = selectedCategory === 'All'
    ? mockTemplates
    : mockTemplates.filter(template => template.category === selectedCategory);

  const getButtonClass = (category: SopTemplateCategory | 'All') => {
    const baseClass = "px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 shadow-sm";
    if (selectedCategory === category) {
      return `${baseClass} bg-primary-600 text-white`;
    }
    return `${baseClass} bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600`;
  };

  return (
    <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setView(View.Documents)} className="text-slate-500 hover:text-primary-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">SOP Templates</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Choose a template to get started, or create a new one from scratch.</p>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <button onClick={() => setSelectedCategory('All')} className={getButtonClass('All')}>All Templates</button>
            {categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={getButtonClass(category)}>
                {category}
            </button>
            ))}
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={onStartFromScratch}
          className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 group"
          role="button"
          aria-label="Start a new SOP from scratch"
        >
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <MagicIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Start from Scratch</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use the AI generator to create a new SOP for any topic.</p>
        </div>
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col hover:shadow-lg transition-shadow duration-300">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                </div>
            </div>
            <div className="flex-grow mt-4">
              <CategoryBadge category={template.category} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{template.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{template.description}</p>
            </div>
            <div className="mt-6">
              <button 
                onClick={() => onSelectTemplate(template)}
                className="w-full bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300 font-semibold py-2 px-4 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
               >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};