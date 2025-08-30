

export enum View {
  Dashboard = 'Dashboard',
  Documents = 'Documents',
  Inspections = 'Inspections',
  Team = 'Team',
  SopGenerator = 'SopGenerator',
  SopTemplates = 'SopTemplates',
  AuditLog = 'AuditLog',
  Settings = 'Settings',
  AdminPanel = 'AdminPanel',
}

export interface Hotel {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  avatar: string;
  status: 'Active' | 'Pending';
  verificationCode?: string;
  hotelIds?: string[];
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  highlightedText: string;
}

export interface Document {
  id: string;
  name: string;
  category: 'SOP' | 'HACCP' | 'Audit' | 'Team File';
  tags: string[];
  lastModified: string;
  modifiedBy: string;
  content?: string;
  type?: string;
  embedLink?: string;
  notes?: Note[];
}

export interface SopStep {
  title: string;
  description: string;
}

export interface Sop {
  title: string;
  purpose: string;
  scope: string;
  steps: SopStep[];
}

export interface SopTemplate {
  id: string;
  title: string;
  description: string;
  details: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details: string;
}

// Types for Daily Inspections
export interface InspectionResult {
  itemId: string;
  itemText: string;
  status: 'pass' | 'fail' | 'n/a';
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface InspectionRecord {
  id: string;
  hotelName: string;
  templateName: string;
  department: string;
  sector: string;
  date: string;
  inspector: string;
  results: InspectionResult[];
  summaryNotes?: string;
  status: 'Completed' | 'Draft';
}

export interface InspectionChecklistItem {
  id: string;
  text: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  department: string;
  sector: string;
  items: InspectionChecklistItem[];
}