import React from 'react';
import { DashboardIcon, DocumentIcon, MagicIcon, ClipboardCheckIcon, TeamIcon, AuditLogIcon } from './icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <p className="mt-4 text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

export const AppCatalog: React.FC = () => (
  <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 md:p-8 animate-fade-in">
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="text-center py-8 border-b-2 border-primary-500 mb-8">
        <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4v-6h2v6h-2z"></path>
            </svg>
            <h1 className="text-5xl font-bold ml-4 text-slate-800 dark:text-white">Auditors Guide</h1>
        </div>
        <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">The Smart Compliance Hub for Modern Operations</p>
      </header>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-800 dark:text-white">Streamline Your Compliance, Elevate Your Standards</h2>
        <p className="text-lg text-slate-700 dark:text-slate-300 text-center max-w-3xl mx-auto">
          Auditors Guide is a comprehensive, AI-powered platform designed for the hospitality and service industries to centralize compliance documentation, streamline daily inspections, and manage team access effortlessly. Move from scattered paperwork to a smart, integrated, and data-driven operational workflow.
        </p>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-6 text-slate-800 dark:text-white">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                  <h3 className="font-semibold text-primary-600 dark:text-primary-400 text-lg">Centralized Control</h3>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">Access all SOPs, HACCP plans, audit records, and team files from one secure hub.</p>
              </div>
              <div className="text-center p-4">
                  <h3 className="font-semibold text-primary-600 dark:text-primary-400 text-lg">Enhanced Efficiency</h3>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">Automate SOP creation and digitize daily inspections to save time and reduce manual effort.</p>
              </div>
              <div className="text-center p-4">
                  <h3 className="font-semibold text-primary-600 dark:text-primary-400 text-lg">Data-Driven Insights</h3>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">Utilize the powerful dashboard to track compliance scores, monitor performance, and identify areas for improvement.</p>
              </div>
          </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-white">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard 
            icon={<DashboardIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="Interactive Dashboard"
            description="Get a real-time overview of your operations. Track average compliance scores, monitor open issues, view auditor performance, and see a live feed of recent activities across your properties."
          />
          <FeatureCard 
            icon={<DocumentIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="Document Hub"
            description="A central repository for all essential documents. Upload existing files to Google Drive, manage SOPs, HACCP plans, and audit reports. Search, preview, and collaborate with inline notes."
          />
          <FeatureCard 
            icon={<MagicIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="AI SOP Generator"
            description="Leverage the power of Gemini to create professional, detailed Standard Operating Procedures in minutes. Start from proven templates or generate a custom SOP from scratch based on your specific needs."
          />
          <FeatureCard 
            icon={<ClipboardCheckIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="Digital Inspections"
            description="Conduct daily inspections using customizable templates. Record pass/fail status, capture photo evidence for failed items, and add corrective action notes on the spot. Save drafts and complete reports digitally."
          />
           <FeatureCard 
            icon={<TeamIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="Team & Role Management"
            description="Control who sees what with role-based access (Admin, Editor, Viewer). Invite new members, manage permissions, and ensure the right information is accessible to the right people."
          />
           <FeatureCard 
            icon={<AuditLogIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
            title="Comprehensive Audit Log"
            description="Maintain a complete, time-stamped record of all significant actions within the platform. Track logins, document changes, SOP generation, and user invitations for full accountability."
          />
        </div>
      </section>
      
      {/* How to Use */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-white">How to Get Started</h2>
        <div className="relative">
            {/* The line */}
            <div className="hidden md:block absolute top-5 left-1/2 w-0.5 h-[calc(100%-2.5rem)] bg-slate-300 dark:bg-slate-700"></div>
            
            <div className="space-y-12 md:space-y-0">
                {/* Step 1 */}
                <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                    <div className="md:text-right md:pr-8">
                        <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">1. Set Up Your Hub</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">An administrator logs in and uses the Admin Panel to add hotels or properties and invite team members, assigning them appropriate roles (Admin, Editor, or Viewer).</p>
                    </div>
                    <div className="flex justify-center md:justify-start mt-4 md:mt-0">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg ring-8 ring-slate-100 dark:ring-slate-900 flex-shrink-0">1</div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="md:grid md:grid-cols-2 md:gap-8 items-center mt-12">
                    <div className="md:order-2 md:pl-8">
                        <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">2. Populate Documents</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Upload existing compliance documents or use the AI Generator to create new SOPs. Organize everything by category and tags for easy access.</p>
                    </div>
                     <div className="flex justify-center md:justify-end md:order-1 mt-4 md:mt-0">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg ring-8 ring-slate-100 dark:ring-slate-900 flex-shrink-0">2</div>
                    </div>
                </div>

                {/* Step 3 */}
                 <div className="md:grid md:grid-cols-2 md:gap-8 items-center mt-12">
                    <div className="md:text-right md:pr-8">
                        <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">3. Conduct Inspections</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Team members can select an inspection template (e.g., 'Daily Kitchen Hygiene'), perform the audit on a tablet or computer, and submit the digital report instantly.</p>
                    </div>
                    <div className="flex justify-center md:justify-start mt-4 md:mt-0">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg ring-8 ring-slate-100 dark:ring-slate-900 flex-shrink-0">3</div>
                    </div>
                </div>
                
                 {/* Step 4 */}
                <div className="md:grid md:grid-cols-2 md:gap-8 items-center mt-12">
                    <div className="md:order-2 md:pl-8">
                        <h3 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">4. Monitor & Improve</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Managers and admins use the Dashboard to view compliance trends, identify recurring issues, and track resolution times, making informed decisions to improve operational standards.</p>
                    </div>
                     <div className="flex justify-center md:justify-end md:order-1 mt-4 md:mt-0">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg ring-8 ring-slate-100 dark:ring-slate-900 flex-shrink-0">4</div>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  </div>
);