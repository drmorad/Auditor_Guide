export enum View {
  Dashboard = 'DASHBOARD',
  Documents = 'DOCUMENTS',
  Inspections = 'INSPECTIONS',
  Team = 'TEAM',
  AuditLog = 'AUDIT_LOG',
  Settings = 'SETTINGS',
  SopGenerator = 'SOP_GENERATOR',
  SopTemplates = 'SOP_TEMPLATES',
  AdminPanel = 'ADMIN_PANEL',
  UserProfile = 'USER_PROFILE',
  Reporting = 'REPORTING',
  Scheduler = 'SCHEDULER',
  Planner = 'PLANNER',
}

export interface SopStep {
  title: string;
  description: string;
}

export interface Sop {
  title: string;
  purpose?: string;
  scope?: string;
  steps: SopStep[];
}

export interface Area {
  id: string;
  name: string;
  type: 'Outlet' | 'Bar' | 'Pool' | 'Public Area' | 'Back of House';
}

export interface Hotel {
  id: string;
  name: string;
  areas?: Area[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: Date;
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Pending';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; // URL to avatar image
  role: UserRole;
  status: UserStatus;
  password?: string;
  verificationCode?: string;
  organizationId: string;
  hotelIds?: string[];
  jobTitle?: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: string; // ISO date string
  highlightedText: string;
}

export interface Document {
  id: string;
  name:string;
  category: 'SOP' | 'HACCP' | 'Audit' | 'Team File';
  tags: string[];
  lastModified: string; // ISO date string
  modifiedBy: string;
  embedLink?: string;
  type?: string;
  content?: string;
  notes?: Note[];
  organizationId: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface InspectionResult {
    questionId: string;
    question: string;
    status: 'pass' | 'fail' | 'pending';
    photo?: string; // base64 string
    notes?: string;
}

export interface InspectionRecord {
    id: string;
    templateId: string;
    templateName: string;
    date: string; // ISO date string
    auditor: string;
    hotelName: string;
    department: string;
    status: 'In Progress' | 'Completed' | 'Overdue';
    results: InspectionResult[];
    complianceScore: number;
    areaId?: string;
    areaName?: string;
}

export interface InspectionQuestion {
    id: string;
    text: string;
    guidance: string;
}

export interface InspectionTemplate {
    id: string;
    name: string;
    department: string;
    questions: InspectionQuestion[];
}


export type SopTemplateCategory = 'Food Safety' | 'Health & Safety' | 'Operations' | 'HR';

export interface SopTemplate {
  id: string;
  title: string;
  description: string;
  details: string;
  category: SopTemplateCategory;
}

export interface Task {
  id: string;
  name: string;
  start: string; // ISO date string 'YYYY-MM-DD'
  end: string;   // ISO date string 'YYYY-MM-DD'
  dependencies: string[]; // Array of task IDs it depends on
  assigneeId: string;
  status: 'pending' | 'in-progress' | 'completed';
  recurringInstanceId?: string; // To group recurring tasks
  parentId?: string; // ID of the parent task
}

export interface PlannedInspection {
  areaName: string;
  templateName: string;
  assignedManager: string;
}

export interface WeeklyPlan {
    monday: PlannedInspection[];
    tuesday: PlannedInspection[];
    wednesday: PlannedInspection[];
    thursday: PlannedInspection[];
    friday: PlannedInspection[];
    saturday: PlannedInspection[];
    sunday: PlannedInspection[];
}