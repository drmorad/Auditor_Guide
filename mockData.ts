
import { User, Document, Hotel, InspectionRecord, InspectionTemplate, Task, Area } from './types';

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', password: 'password', avatar: 'https://i.pravatar.cc/150?u=alice@example.com', role: 'Admin', status: 'Active', organizationId: 'org-1', hotelIds: ['hotel-1', 'hotel-2'], jobTitle: 'General Manager' },
    { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', password: 'password', avatar: 'https://i.pravatar.cc/150?u=bob@example.com', role: 'Editor', status: 'Active', organizationId: 'org-1', hotelIds: ['hotel-1'], jobTitle: 'Executive Chef' },
    { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', password: 'password', avatar: 'https://i.pravatar.cc/150?u=charlie@example.com', role: 'Viewer', status: 'Active', organizationId: 'org-1', hotelIds: ['hotel-2'], jobTitle: 'Front Desk Supervisor' },
    { id: 'user-4', name: 'Diana Prince', email: 'diana@example.com', verificationCode: 'AB12CD', avatar: 'https://i.pravatar.cc/150?u=diana@example.com', role: 'Viewer', status: 'Pending', organizationId: 'org-1', jobTitle: 'New Hire' },
];

export const MOCK_DOCUMENTS: Document[] = [
    { id: 'doc-1', name: 'Hand Washing SOP', category: 'SOP', tags: ['hygiene', 'kitchen'], lastModified: '2024-07-28', modifiedBy: 'Alice Johnson', content: '1. Wet hands with running water...\n2. Apply soap...\n3. Lather and scrub for 20 seconds...\n4. Rinse thoroughly...\n5. Dry hands.', type: 'text/plain', organizationId: 'org-1', notes:[] },
    { id: 'doc-2', name: 'HACCP Plan - Receiving', category: 'HACCP', tags: ['food safety', 'receiving'], lastModified: '2024-07-25', modifiedBy: 'Alice Johnson', content: 'Critical Control Point: Receiving temperature for refrigerated goods must be at or below 41°F (5°C).', type: 'text/plain', organizationId: 'org-1', notes: [] },
    { id: 'doc-3', name: 'Q3 Fire Safety Audit', category: 'Audit', tags: ['safety', 'fire'], lastModified: '2024-07-20', modifiedBy: 'Bob Williams', embedLink: 'https://drive.google.com/file/d/1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt/preview', type: 'application/pdf', organizationId: 'org-1', notes: [] },
];

const MOCK_HOTEL_1_AREAS: Area[] = [
    { id: 'area-1-1', name: 'The Grand Restaurant', type: 'Outlet' },
    { id: 'area-1-2', name: 'Lobby Bar', type: 'Bar' },
    { id: 'area-1-3', name: 'Main Pool', type: 'Pool' },
    { id: 'area-1-4', name: 'Receiving Dock', type: 'Back of House' },
];

const MOCK_HOTEL_2_AREAS: Area[] = [
    { id: 'area-2-1', name: 'Ocean View Grill', type: 'Outlet' },
    { id: 'area-2-2', name: 'Sunset Bar', type: 'Bar' },
    { id: 'area-2-3', name: 'Infinity Pool', type: 'Pool' },
    { id: 'area-2-4', name: 'Main Lobby', type: 'Public Area' },
];


export const MOCK_HOTELS: Hotel[] = [
    { id: 'hotel-1', name: 'Grand Hyatt Resort', areas: MOCK_HOTEL_1_AREAS },
    { id: 'hotel-2', name: 'Seaside Palace', areas: MOCK_HOTEL_2_AREAS },
];

export const MOCK_INSPECTION_TEMPLATES: InspectionTemplate[] = [
    {
        id: 'template-kitchen-1',
        name: 'Daily Kitchen Hygiene',
        department: 'Kitchen',
        questions: [
            { id: 'q1', text: 'Floors are clean, dry, and free of debris.', guidance: 'Check all floor areas, including under equipment and in corners.' },
            { id: 'q2', text: 'Food contact surfaces are clean and sanitized.', guidance: 'Includes cutting boards, prep tables, slicers, etc.' },
            { id: 'q3', text: 'Hand washing stations are stocked and accessible.', guidance: 'Verify soap, paper towels, and hot water availability.' },
            { id: 'q4', text: 'Refrigerators and freezers are at correct temperatures.', guidance: 'Fridge: <= 40°F (4°C), Freezer: <= 0°F (-18°C).' },
            { id: 'q5', text: 'Raw and ready-to-eat foods are properly separated.', guidance: 'Check for raw meat stored above vegetables or cooked foods.' },
            { id: 'q6', text: 'Trash receptacles are not overflowing and are covered.', guidance: 'Ensure lids are used where required.' },
        ],
    },
    {
        id: 'template-pool-1',
        name: 'Daily Pool Safety',
        department: 'Recreation',
        questions: [
            { id: 'p1', text: 'Pool water is clear and free of debris.', guidance: 'Visually inspect for clarity and any floating particles.' },
            { id: 'p2', text: 'Chlorine and pH levels are within required range.', guidance: 'Check logs or perform on-site test. Chlorine: 1-3 ppm, pH: 7.2-7.8.' },
            { id: 'p3', text: 'Safety equipment is present and in good condition.', guidance: 'Verify life rings, shepherd\'s hook, and first aid kit are accessible.' },
            { id: 'p4', text: 'Deck area is clean and free of slip hazards.', guidance: 'Check for standing water, algae, or trip hazards.' },
            { id: 'p5', text: 'All pool gates and fences are secure and self-latching.', guidance: 'Test all entry points to the pool area.' },
        ],
    },
    {
        id: 'template-housekeeping-1',
        name: 'Guest Room Cleanliness Check',
        department: 'Housekeeping',
        questions: [
            { id: 'h1', text: 'All surfaces are dusted and free of smudges.', guidance: 'Check furniture, fixtures, windowsills, and electronics.' },
            { id: 'h2', text: 'Bathroom is sanitized (toilet, shower, sink, floor).', guidance: 'Look for cleanliness and ensure all chrome is polished.' },
            { id: 'h3', text: 'Linens and towels are fresh, clean, and properly placed.', guidance: 'Check for stains, tears, and correct folding.' },
            { id: 'h4', text: 'All amenities are stocked according to standard.', guidance: 'Verify toiletries, coffee/tea supplies, and stationery.' },
        ],
    },
    {
        id: 'template-receiving-1',
        name: 'Food & Beverage Receiving Log',
        department: 'Receiving',
        questions: [
            { id: 'r1', text: 'Delivery vehicle is clean and free of pests.', guidance: 'Inspect the interior of the truck before unloading.' },
            { id: 'r2', text: 'Product temperatures match invoice (check refrigerated/frozen).', guidance: 'Use a calibrated thermometer to check a sample of items.' },
            { id: 'r3', text: 'Packaging is intact, not damaged or leaking.', guidance: 'Reject any items with compromised packaging (dents, tears, leaks).' },
            { id: 'r4', text: 'Products are within their expiration dates.', guidance: 'Check "use-by" or "best-by" dates on all items.' },
        ],
    },
     {
        id: 'template-bar-1',
        name: 'Bar Opening Checklist',
        department: 'Bars',
        questions: [
            { id: 'b1', text: 'Bar counters and surfaces are clean and sanitized.', guidance: 'Wipe down all guest-facing and staff-facing surfaces.' },
            { id: 'b2', text: 'Glassware is clean, polished, and free of chips/cracks.', guidance: 'Hold glasses up to the light to inspect.' },
            { id: 'b3', text: 'Ice wells are drained, cleaned, and refilled with fresh ice.', guidance: 'Use a dedicated scoop for ice.' },
            { id: 'b4', text: 'Garnishes are fresh and stored in clean, covered containers.', guidance: 'Check the quality of sliced fruits and other garnishes.' },
            { id: 'b5', text: 'Beer taps have been flushed and drip trays are clean.', guidance: 'Run a small amount of beer through each tap.' },
        ],
    }
];

export const MOCK_TASKS: Task[] = [
    { id: 'task-1', name: 'Prepare Q3 Audit Report', start: '2024-08-05', end: '2024-08-09', dependencies: [], assigneeId: 'user-1', status: 'completed' },
    { id: 'task-2', name: 'Review Kitchen SOPs', start: '2024-08-08', end: '2024-08-12', dependencies: [], assigneeId: 'user-2', status: 'in-progress' },
    { id: 'task-3', name: 'Finalize HACCP Plan', start: '2024-08-13', end: '2024-08-16', dependencies: ['task-2'], assigneeId: 'user-1', status: 'pending' },
    { id: 'task-4', name: 'Schedule Fire Safety Training', start: '2024-08-10', end: '2024-08-14', dependencies: [], assigneeId: 'user-3', status: 'in-progress' },
    { id: 'task-5', name: 'Distribute Training Materials', start: '2024-08-15', end: '2024-08-16', dependencies: ['task-4'], assigneeId: 'user-3', status: 'pending' },
    { id: 'task-6', name: 'Present Audit Findings', start: '2024-08-19', end: '2024-08-20', dependencies: ['task-1', 'task-3'], assigneeId: 'user-1', status: 'pending' },
];

export const MOCK_INSPECTION_RECORDS: InspectionRecord[] = [
    // ... some mock records if needed for reporting
];