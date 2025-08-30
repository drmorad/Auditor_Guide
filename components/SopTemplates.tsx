
import React from 'react';
import { SopTemplate, View } from '../types';
import { DocumentIcon, MagicIcon } from './icons';

const mockTemplates: SopTemplate[] = [
  {
    id: 'template-1',
    title: 'Hand Washing Procedure',
    description: 'A standard template for ensuring proper hand hygiene to prevent cross-contamination in food handling environments.',
    details: 'Covers steps for washing hands, when to wash hands, and supplies needed. For all food service and healthcare staff.',
  },
  {
    id: 'template-2',
    title: 'Receiving and Storing Food',
    description: 'Guidelines for safely receiving food deliveries and storing them at correct temperatures to maintain quality and safety.',
    details: 'Includes checking delivery vehicle cleanliness, verifying temperatures of refrigerated and frozen items, and first-in, first-out (FIFO) storage principles.',
  },
  {
    id: 'template-3',
    title: 'Cleaning and Sanitizing Surfaces',
    description: 'A procedure for the daily cleaning and sanitization of all food contact surfaces, equipment, and high-touch areas.',
    details: 'Specify the 3-step cleaning process (wash, rinse, sanitize), the approved chemical sanitizers, their correct concentrations, and contact times.',
  },
  {
    id: 'template-4',
    title: 'Emergency Action Plan',
    description: 'A general template for responding to common emergencies like fires, power outages, or medical incidents in the workplace.',
    details: 'Include evacuation routes, emergency contact numbers, location of fire extinguishers, and roles of key personnel during an emergency.',
  },
  {
    id: 'template-5',
    title: 'Hazardous Material Handling',
    description: 'A procedure for safely handling, storing, and disposing of hazardous materials to ensure staff safety and compliance.',
    details: 'Include requirements for Personal Protective Equipment (PPE), location of Safety Data Sheets (SDS), and spill clean-up procedures.',
  },
   {
    id: 'template-6',
    title: 'Customer Complaint Resolution',
    description: 'A standardized process for receiving, documenting, and resolving customer complaints to ensure satisfaction and quality control.',
    details: 'Outline steps for logging complaints, escalating issues, communicating with the customer, and implementing corrective actions.',
  },
];

interface SopTemplatesProps {
  onSelectTemplate: (template: SopTemplate) => void;
  onStartFromScratch: () => void;
  setView: (view: View) => void;
}

export const SopTemplates: React.FC<SopTemplatesProps> = ({ onSelectTemplate, onStartFromScratch, setView }) => {
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
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Choose a template or start with a blank slate.</p>
                </div>
            </div>
            <button 
                onClick={onStartFromScratch}
                className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
                <MagicIcon className="w-5 h-5 text-primary-500"/>
                Start from Scratch
            </button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col hover:shadow-lg transition-shadow duration-300">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                </div>
            </div>
            <div className="flex-grow mt-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{template.title}</h3>
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