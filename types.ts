export enum View {
  Dashboard = 'DASHBOARD',
  Login = 'LOGIN',
  Documents = 'DOCUMENTS',
  SopLibrary = 'SOP_LIBRARY',
  SopGenerator = 'SOP_GENERATOR',
  SopTemplates = 'SOP_TEMPLATES',
  Inspections = 'INSPECTIONS',
  Incidents = 'INCIDENTS',
  Team = 'TEAM',
  Reporting = 'REPORTING',
  Scheduler = 'SCHEDULER',
  Planner = 'PLANNER',
  AuditLog = 'AUDIT_LOG',
  AdminPanel = 'ADMIN_PANEL',
  UserProfile = 'USER_PROFILE',
  Settings = 'SETTINGS',
}

// User & Auth
export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Pending';
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  organizationId: string;
  jobTitle?: string;
  verificationCode?: string;
  hotelIds?: string[];
}

// Documents
export interface Note {
  id: string;
  content: string;
  timestamp: string;
  highlightedText: string;
}
export interface Document {
  id: string;
  driveId?: string;
  name: string;
  category: 'SOP' | 'HACCP' | 'Audit' | 'Team File';
  tags: string[];
  lastModified: string;
  modifiedBy: string;
  embedLink?: string;
  type?: string;
  content?: string;
  organizationId: string;
  notes?: Note[];
}

// SOPs
export type SopTemplateCategory = 'Food Safety' | 'Health & Safety' | 'Operations' | 'HR';
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
  category: SopTemplateCategory;
}

// Hotels
export interface Area {
    id: string;
    name: string;
    type: string;
}
export interface Hotel {
    id: string;
    name: string;
    areas?: Area[];
}

// Inspections
export interface InspectionQuestion {
    id: string;
    text: string;
    guidance?: string;
}
export interface InspectionTemplate {
    id: string;
    name: string;
    department: string;
    questions: InspectionQuestion[];
}
export interface InspectionResult {
    questionId: string;
    question: string;
    status: 'pass' | 'fail' | 'pending';
    notes?: string;
    photos?: string[];
}
export interface InspectionRecord {
    id: string;
    templateId: string;
    templateName: string;
    date: string;
    auditor: string;
    hotelName: string;
    areaId?: string;
    areaName?: string;
    department: string;
    status: 'In Progress' | 'Completed' | 'Overdue';
    results: InspectionResult[];
    complianceScore: number;
}
export interface WeeklyPlanItem {
    areaName: string;
    templateName: string;
    assignedManager: string;
}
export interface WeeklyPlan {
    monday: WeeklyPlanItem[];
    tuesday: WeeklyPlanItem[];
    wednesday: WeeklyPlanItem[];
    thursday: WeeklyPlanItem[];
    friday: WeeklyPlanItem[];
    saturday: WeeklyPlanItem[];
    sunday: WeeklyPlanItem[];
}

// Incidents
export type IncidentSeverity = 'Low' | 'Medium' | 'Critical';
export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved' | 'Verified';
export type IncidentCategory = 'Maintenance' | 'Safety' | 'Hygiene' | 'Guest' | 'Security';
export interface IncidentLog {
    date: string;
    action: string;
    user: string;
}
export interface Incident {
    id: string;
    title: string;
    description: string;
    hotelId: string;
    areaId?: string;
    severity: IncidentSeverity;
    category: IncidentCategory;
    status: IncidentStatus;
    reportedBy: string;
    assignedTo?: string;
    photos?: string[];
    createdAt: string;
    updatedAt: string;
    logs: IncidentLog[];
}

// Tasks
export interface Task {
    id: string;
    name: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High';
    start: string;
    end: string;
    assigneeId: string;
    dependencies: string[];
    status: 'pending' | 'in-progress' | 'completed';
    parentId?: string;
    recurringInstanceId?: string;
}

// General
export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: Date;
}
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}