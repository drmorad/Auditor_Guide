import { User, Document, Hotel, InspectionRecord, InspectionTemplate, Task, Incident } from './types';

export const MOCK_USERS: User[] = [];

export const MOCK_DOCUMENTS: Document[] = [
    { id: 'doc-1', driveId: '1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt', name: 'Q3 Financial Report.pdf', category: 'Audit', tags: ['finance', 'quarterly'], lastModified: '2024-07-28', modifiedBy: 'Alex Johnson', embedLink: 'https://drive.google.com/file/d/1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt/preview', type: 'application/pdf', organizationId: 'org-1', notes: [] },
    { id: 'doc-2', name: 'Hand Washing SOP', category: 'SOP', tags: ['hygiene', 'kitchen'], lastModified: '2024-07-25', modifiedBy: 'Maria Garcia', content: '1. Wet hands with warm water.\n2. Apply soap.\n3. Lather for 20 seconds.\n4. Rinse thoroughly.\n5. Dry with a single-use towel.', type: 'text/plain', organizationId: 'org-1', notes: [] },
    { id: 'doc-3', name: 'Weekly HACCP Log', category: 'HACCP', tags: ['food safety', 'logs'], lastModified: '2024-07-20', modifiedBy: 'Alex Johnson', content: 'Date: 2024-07-20\nFridge Temp: 38°F\nFreezer Temp: -5°F\nLine Check: All items temped and recorded.', type: 'text/plain', organizationId: 'org-1', notes: [] },
    { id: 'doc-4', name: 'Onboarding Checklist', category: 'Team File', tags: ['hr', 'training'], lastModified: '2024-07-15', modifiedBy: 'Alex Johnson', content: 'New hire paperwork, uniform assignment, system training.', type: 'text/plain', organizationId: 'org-1', notes: [] },
];

export const MOCK_HOTELS: Hotel[] = [
    { id: 'hotel-1', name: 'Grand Hyatt Resort', areas: [{id: 'area-1', name: 'Main Kitchen', type: 'Kitchen'}, {id: 'area-2', name: 'Lobby Bar', type: 'Bar'}] },
    { id: 'hotel-2', name: 'Seaside Marriott Villas', areas: [{id: 'area-3', name: 'Poolside Cafe', type: 'Outlet'}] },
    { id: 'hotel-3', name: 'Downtown Hilton', areas: [] },
];

export const MOCK_INSPECTION_TEMPLATES: InspectionTemplate[] = [
    { 
        id: 'template-1', name: 'Daily Kitchen Hygiene', department: 'Kitchen',
        questions: [
            { id: 'q1', text: 'Are all surfaces clean and sanitized?' },
            { id: 'q2', text: 'Are hand washing stations stocked?' },
        ]
    },
    { 
        id: 'template-2', name: 'Lobby Cleanliness Check', department: 'Housekeeping',
        questions: [
            { id: 'q3', text: 'Is the floor free of debris?' },
            { id: 'q4', text: 'Is the furniture arranged correctly?' },
        ]
    }
];

export const MOCK_INSPECTION_RECORDS: InspectionRecord[] = [
    { id: 'rec-1', templateId: 'template-1', templateName: 'Daily Kitchen Hygiene', date: '2024-07-28', auditor: 'Maria Garcia', hotelName: 'Grand Hyatt Resort', department: 'Kitchen', status: 'Completed', results: [{questionId: 'q1', question: 'Are all surfaces clean and sanitized?', status: 'pass'}, {questionId: 'q2', question: 'Are hand washing stations stocked?', status: 'pass'}], complianceScore: 100 },
    { id: 'rec-2', templateId: 'template-2', templateName: 'Lobby Cleanliness Check', date: '2024-07-27', auditor: 'David Smith', hotelName: 'Downtown Hilton', department: 'Housekeeping', status: 'In Progress', results: [{questionId: 'q3', question: 'Is the floor free of debris?', status: 'pending'}, {questionId: 'q4', question: 'Is the furniture arranged correctly?', status: 'pending'}], complianceScore: 0 },
    { id: 'rec-3', templateId: 'template-1', templateName: 'Daily Kitchen Hygiene', date: '2024-07-26', auditor: 'Maria Garcia', hotelName: 'Grand Hyatt Resort', department: 'Kitchen', status: 'Completed', results: [{questionId: 'q1', question: 'Are all surfaces clean and sanitized?', status: 'pass'}, {questionId: 'q2', question: 'Are hand washing stations stocked?', status: 'fail', notes: 'No soap at main station.', photos: ['https://images.unsplash.com/photo-1584486188544-dc21b2877843?q=80&w=2070&auto=format&fit=crop']}], complianceScore: 50 },
];

export const MOCK_TASKS: Task[] = [
    { id: 'task-1', name: 'Quarterly Fire Drill', start: '2024-08-01', end: '2024-08-01', assigneeId: 'user-1', dependencies: [], status: 'pending', priority: 'High' },
    { id: 'task-2', name: 'Review new SOPs', start: '2024-08-02', end: '2024-08-05', assigneeId: 'user-2', dependencies: [], status: 'in-progress', priority: 'Medium' },
];

export const MOCK_INCIDENTS: Incident[] = [
    { id: 'inc-1', title: 'Freezer unit not cooling', description: 'The walk-in freezer is at 15°F, should be 0°F.', hotelId: 'hotel-1', severity: 'Critical', category: 'Maintenance', status: 'Open', reportedBy: 'Maria Garcia', createdAt: '2024-07-29T10:00:00Z', updatedAt: '2024-07-29T10:00:00Z', logs: [] },
    { id: 'inc-2', title: 'Guest slip in lobby', description: 'Water on the floor near the entrance caused a guest to slip. No injury reported.', hotelId: 'hotel-3', severity: 'Medium', category: 'Safety', status: 'Resolved', reportedBy: 'David Smith', assignedTo: 'user-2', createdAt: '2024-07-28T14:00:00Z', updatedAt: '2024-07-28T16:00:00Z', logs: [] },
];
