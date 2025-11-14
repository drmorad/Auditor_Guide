import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Task, User } from '../types';
import { XIcon, PlusCircleIcon, MagicIcon } from './icons';
import { suggestTaskDetails } from '../services/geminiService';

const CreateTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'recurringInstanceId'>, recurring?: { frequency: 'daily' | 'weekly' | 'monthly', endDate: string }) => void;
    users: User[];
    tasks: Task[];
}> = ({ isOpen, onClose, onSave, users, tasks }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [status, setStatus] = useState<Task['status']>('pending');
    const [parentId, setParentId] = useState('');
    const [error, setError] = useState('');

    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [recurringEndDate, setRecurringEndDate] = useState('');
    
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setName('');
            setDescription('');
            setPriority('Medium');
            setStart('');
            setEnd('');
            setAssigneeId('');
            setDependencies([]);
            setStatus('pending');
            setParentId('');
            setError('');
            setIsRecurring(false);
            setFrequency('daily');
            setRecurringEndDate('');
            setIsSuggesting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setError('');
        if (!name || !start || !end || !assigneeId) {
            setError('Task name, start/end dates, and assignee are required.');
            return;
        }
        if (new Date(end) < new Date(start)) {
            setError('End date cannot be before the start date.');
            return;
        }
        if (isRecurring) {
            if (!recurringEndDate) {
                setError('Please set an end date for the recurrence.');
                return;
            }
            if (new Date(recurringEndDate) < new Date(end)) {
                setError('The recurrence end date cannot be before the task end date.');
                return;
            }
        }

        const taskData: Omit<Task, 'id' | 'recurringInstanceId'> = { name, start, end, assigneeId, dependencies, status, parentId: parentId || undefined, description, priority };
        
        if (isRecurring) {
            onSave(taskData, { frequency, endDate: recurringEndDate });
        } else {
            onSave(taskData);
        }
        onClose();
    };
    
    const handleDependencyToggle = (taskId: string) => {
        setDependencies(prev => 
            prev.includes(taskId) 
                ? prev.filter(id => id !== taskId) 
                : [...prev, taskId]
        );
    };
    
    const handleSuggestDetails = async () => {
        if (!name.trim()) {
            setError("Please enter a task name first to get suggestions.");
            return;
        }
        setIsSuggesting(true);
        setError('');
        try {
            const details = await suggestTaskDetails(name);
            setDescription(prev => prev ? `${prev}\n\n${details}` : details);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to get AI suggestion.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose} aria-modal="true" role="dialog"
        >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Task</h2>
                </div>
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Core Details</legend>
                        <div>
                            <label htmlFor="task-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Name</label>
                            <input id="task-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                <button type="button" onClick={handleSuggestDetails} disabled={isSuggesting || !name} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSuggesting ? (
                                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <MagicIcon className="w-4 h-4"/>
                                    )}
                                    Suggest with AI
                                </button>
                            </div>
                            <textarea id="task-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                        </div>
                         <div>
                            <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                            <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </fieldset>

                    <fieldset className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <legend className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Scheduling & Assignment</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="task-start" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                                <input id="task-start" type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                            </div>
                            <div>
                                <label htmlFor="task-end" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                <input id="task-end" type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="task-assignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                                <select id="task-assignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option value="" disabled>Select a user...</option>
                                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="task-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select id="task-status" value={status} onChange={e => setStatus(e.target.value as Task['status'])} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In-progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2 space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"/>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Make this a recurring task</span>
                            </label>
                            {isRecurring && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <div>
                                        <label htmlFor="task-frequency" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                                        <select id="task-frequency" value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="task-recurring-end" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Repeat until</label>
                                        <input id="task-recurring-end" type="date" value={recurringEndDate} onChange={e => setRecurringEndDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </fieldset>
                    
                    <fieldset className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <legend className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Relationships</legend>
                         <div>
                            <label htmlFor="task-parent" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Task (Optional)</label>
                            <select id="task-parent" value={parentId} onChange={e => setParentId(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                <option value="">None</option>
                                {tasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dependencies (Optional)</label>
                            <div className="max-h-32 overflow-y-auto p-2 border border-slate-300 dark:border-slate-600 rounded-md space-y-2">
                                {tasks.length > 0 ? tasks.map(task => (
                                    <label key={task.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={dependencies.includes(task.id)} onChange={() => handleDependencyToggle(task.id)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"/>
                                        <span className="text-sm text-slate-800 dark:text-slate-200">{task.name}</span>
                                    </label>
                                )) : <p className="text-xs text-slate-500">No other tasks exist to depend on.</p>}
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md">Save Task</button>
                </div>
            </div>
        </div>
    );
};

const addDaysToDateString = (dateStr: string, days: number): string => {
    const date = new Date(dateStr + 'T12:00:00Z'); // Use noon to avoid timezone issues
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

// Helper to get number of days between two dates, ignoring time
const daysBetween = (date1: Date, date2: Date): number => {
    const oneDay = 1000 * 60 * 60 * 24;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
};

// Date formatting helper
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isTaskOverdue = (task: Task): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.end);
    taskEnd.setHours(0, 0, 0, 0);
    return taskEnd < today && task.status !== 'completed';
};

const getStatusStyles = (task: Task) => { // Now takes the full task object
    if (isTaskOverdue(task)) {
        return 'bg-red-500 border-red-700 dark:bg-red-600 dark:border-red-800';
    }
    switch(task.status) {
        case 'completed': return 'bg-emerald-500 border-emerald-700 dark:bg-emerald-600 dark:border-emerald-800';
        case 'in-progress': return 'bg-sky-500 border-sky-700 dark:bg-sky-600 dark:border-sky-800 relative after:absolute after:inset-0 after:bg-stripes after:bg-[length:16px_16px] after:opacity-20';
        case 'pending': return 'bg-slate-400 border-slate-600 dark:bg-slate-500 dark:border-slate-700';
    }
};

const getTaskBarStyles = (task: Task) => {
    const statusClass = getStatusStyles(task);
    const priorityClass = {
        Low: 'border-l-4 border-green-400',
        Medium: 'border-l-4 border-yellow-400',
        High: 'border-l-4 border-red-400',
    };
    return `${statusClass} ${priorityClass[task.priority || 'Medium']}`;
};

const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
  const styles = {
    pending: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'in-progress': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  };
  const text = {
      pending: 'Pending',
      'in-progress': 'In Progress',
      completed: 'Completed',
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {text[status]}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: Task['priority'] }> = ({ priority = 'Medium' }) => {
    const styles = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:green-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
            {priority}
        </span>
    );
};

interface DependencyLine {
    id: string;
    path: string;
}

type InteractionState =
    | { type: 'move'; taskId: string; initialX: number; initialTask: Task; childTasks: Task[]; daysMoved: number; }
    | { type: 'resize-end'; taskId: string; initialX: number; initialTask: Task; }
    | { type: 'resize-start'; taskId: string; initialX: number; initialTask: Task; }
    | { type: 'link'; fromId: string; fromX: number; fromY: number; toX: number; toY: number; };


interface SchedulerProps {
    tasks: Task[];
    users: User[];
    onAddTask: (task: Omit<Task, 'id' | 'recurringInstanceId'>, recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate: string; }) => void;
    onUpdateTasks: (updatedTasks: Task[]) => void;
}

export const Scheduler: React.FC<SchedulerProps> = ({ tasks, users, onAddTask, onUpdateTasks }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const ganttGridRef = useRef<HTMLDivElement>(null);
    const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const dateHeaderRefs = useRef<(HTMLDivElement | null)[]>([]);
    const dayWidthRef = useRef<number>(60);
    
    const [dependencyLines, setDependencyLines] = useState<DependencyLine[]>([]);
    const [todayMarkerLeft, setTodayMarkerLeft] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
    const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [tasks]);

    const displayTasks = useMemo(() => {
        const tasksWithLevel: (Task & { level: number })[] = [];
        const childrenMap = new Map<string, Task[]>();
        
        sortedTasks.forEach(task => {
            if (task.parentId) {
                const children = childrenMap.get(task.parentId) || [];
                children.push(task);
                childrenMap.set(task.parentId, children);
            }
        });

        const addChildren = (parentId: string, level: number) => {
            const children = childrenMap.get(parentId)?.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            if (children) {
                children.forEach(child => {
                    tasksWithLevel.push({ ...child, level });
                    addChildren(child.id, level + 1);
                });
            }
        };

        sortedTasks.forEach(task => {
            if (!task.parentId) {
                tasksWithLevel.push({ ...task, level: 0 });
                addChildren(task.id, 1);
            }
        });

        return tasksWithLevel;
    }, [sortedTasks]);


    const filteredTasks = useMemo(() => {
        if (statusFilter === 'all') {
            return displayTasks;
        }
        
        const filtered = displayTasks.filter(task => task.status === statusFilter);
        const parentIds = new Set(filtered.map(t => t.parentId).filter(Boolean));
        const finalFilter = displayTasks.filter(task => task.status === statusFilter || parentIds.has(task.id));
        return finalFilter;

    }, [displayTasks, statusFilter]);

    const { dateRange, gridStartDate, totalDays, todayOffset } = useMemo(() => {
        if (tasks.length === 0) {
            const start = new Date();
            start.setDate(1);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            const range = [];
            let current = new Date(start);
            while (current <= end) {
                range.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            return { dateRange: range, gridStartDate: start, totalDays: range.length, todayOffset: new Date().getDate() - 1 };
        }
        
        const allDates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 10);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        let currentTodayOffset = -1;
        const range = [];
        let currentDate = new Date(minDate);
        currentDate.setHours(0,0,0,0);
        let i = 0;
        while (currentDate <= maxDate) {
            range.push(new Date(currentDate));
            if (currentDate.getTime() === today.getTime()) {
                currentTodayOffset = i;
            }
            currentDate.setDate(currentDate.getDate() + 1);
            i++;
        }

        return { dateRange: range, gridStartDate: minDate, totalDays: range.length, todayOffset: currentTodayOffset };
    }, [tasks]);

    const recalculatePositions = useCallback(() => {
        if (!containerRef.current) return;
        const newLines: DependencyLine[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        const svgTopOffset = 58;

        displayTasks.forEach(task => {
            if (task.dependencies.length > 0) {
                const dependentEl = taskRefs.current[task.id];
                if (!dependentEl) return;
                const dependentRect = dependentEl.getBoundingClientRect();
                const dependentCenterY = (dependentRect.top - containerRect.top + dependentRect.height / 2) - svgTopOffset;

                task.dependencies.forEach(depId => {
                    const prerequisiteEl = taskRefs.current[depId];
                    if (!prerequisiteEl) return;
                    const prerequisiteRect = prerequisiteEl.getBoundingClientRect();
                    const prerequisiteCenterY = (prerequisiteRect.top - containerRect.top + prerequisiteRect.height / 2) - svgTopOffset;

                    const startX = prerequisiteRect.right - containerRect.left;
                    const startY = prerequisiteCenterY;

                    const endX = dependentRect.left - containerRect.left;
                    const endY = dependentCenterY;

                    if (endX <= startX + 5) return;

                    const controlX1 = startX + 20;
                    const controlY1 = startY;
                    const controlX2 = endX - 20;
                    const controlY2 = endY;

                    const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                    newLines.push({ id: `${depId}-${task.id}`, path });
                });
            }
        });
        setDependencyLines(newLines);

        if (todayOffset >= 0 && dateHeaderRefs.current[todayOffset]) {
            const todayEl = dateHeaderRefs.current[todayOffset];
            if (todayEl) setTodayMarkerLeft(todayEl.offsetLeft + todayEl.offsetWidth / 2);
        } else {
            setTodayMarkerLeft(null);
        }

        if (ganttGridRef.current) {
            dayWidthRef.current = (ganttGridRef.current.scrollWidth - 250) / totalDays;
        }

    }, [displayTasks, todayOffset, totalDays]);
    
    useEffect(() => {
        if (viewMode !== 'gantt') return;
        const observer = new ResizeObserver(recalculatePositions);
        const container = containerRef.current;
        if (container) observer.observe(container);
        recalculatePositions();
        return () => {
            if (container) observer.unobserve(container);
        };
    }, [recalculatePositions, viewMode, tasks]);


    const getChildrenRecursive = useCallback((taskId: string, allTasks: Task[]): Task[] => {
        const children = allTasks.filter(t => t.parentId === taskId);
        return [...children, ...children.flatMap(c => getChildrenRecursive(c.id, allTasks))];
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!interaction) return;
            
            const dx = e.clientX - interaction.initialX;
            const daysMoved = Math.round(dx / dayWidthRef.current);

            switch (interaction.type) {
                case 'move':
                    setInteraction({ ...interaction, daysMoved });
                    break;
                case 'resize-end':
                case 'resize-start':
                     setInteraction({ ...interaction, initialX: e.clientX }); // update initialX to prevent acceleration
                     break;
                case 'link': {
                    if (!containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    setInteraction({
                        ...interaction,
                        toX: e.clientX - rect.left,
                        toY: e.clientY - rect.top - 58
                    });
                     // Highlight target task
                    document.querySelectorAll('[data-task-id]').forEach(el => el.classList.remove('ring-2', 'ring-primary-500'));
                    const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-task-id]');
                    if (targetEl && targetEl.getAttribute('data-task-id') !== interaction.fromId) {
                        targetEl.classList.add('ring-2', 'ring-primary-500');
                    }
                    break;
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!interaction) return;
            const { type } = interaction;
            const dx = e.clientX - interaction.initialX;
            const daysMoved = Math.round(dx / dayWidthRef.current);
            
            if (type === 'move') {
                const { initialTask, childTasks } = interaction;
                if (daysMoved !== 0) {
                    const updatedParent = { ...initialTask, start: addDaysToDateString(initialTask.start, daysMoved), end: addDaysToDateString(initialTask.end, daysMoved) };
                    const updatedChildren = childTasks.map(child => ({ ...child, start: addDaysToDateString(child.start, daysMoved), end: addDaysToDateString(child.end, daysMoved) }));
                    onUpdateTasks([updatedParent, ...updatedChildren]);
                }
            } else if (type === 'resize-end') {
                const { initialTask } = interaction;
                const newEnd = addDaysToDateString(initialTask.end, daysMoved);
                if (newEnd >= initialTask.start) {
                    onUpdateTasks([{ ...initialTask, end: newEnd }]);
                }
            } else if (type === 'resize-start') {
                 const { initialTask } = interaction;
                 const newStart = addDaysToDateString(initialTask.start, daysMoved);
                 if (newStart <= initialTask.end) {
                     onUpdateTasks([{...initialTask, start: newStart}]);
                 }
            } else if (type === 'link') {
                 document.querySelectorAll('[data-task-id]').forEach(el => el.classList.remove('ring-2', 'ring-primary-500'));
                 const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-task-id]');
                 const toId = targetEl?.getAttribute('data-task-id');
                 const fromId = interaction.fromId;
                 if (toId && fromId && toId !== fromId) {
                     const targetTask = tasks.find(t => t.id === toId);
                     if (targetTask && !targetTask.dependencies.includes(fromId)) {
                         const updatedTask = { ...targetTask, dependencies: [...targetTask.dependencies, fromId] };
                         onUpdateTasks([updatedTask]);
                     }
                 }
            }

            setInteraction(null);
        };
        
        if (interaction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interaction, tasks, onUpdateTasks, getChildrenRecursive]);

    const handleInteractionStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-start' | 'resize-end' | 'link') => {
        e.preventDefault();
        e.stopPropagation();

        if (type === 'link') {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const containerRect = containerRef.current!.getBoundingClientRect();
             setInteraction({
                type: 'link',
                fromId: task.id,
                fromX: (rect.left + rect.width / 2) - containerRect.left,
                fromY: (rect.top + rect.height / 2) - containerRect.top - 58, // 58px header height
                toX: e.clientX - containerRect.left,
                toY: e.clientY - containerRect.top - 58,
            });
        } else {
             const childTasks = type === 'move' ? getChildrenRecursive(task.id, tasks) : [];
             setInteraction({ type, taskId: task.id, initialX: e.clientX, initialTask: task, childTasks, daysMoved: 0 });
        }
    };

    const renderGanttView = () => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto" >
              <div className="relative min-w-max" ref={containerRef}>
                {/* Timeline Header */}
                <div className="grid sticky top-0 bg-white dark:bg-slate-800 z-30" ref={ganttGridRef} style={{ gridTemplateColumns: `250px repeat(${totalDays}, minmax(60px, 1fr))` }}>
                    <div className="sticky left-0 bg-white dark:bg-slate-800 z-40 border-r border-b border-slate-200 dark:border-slate-700 p-2 font-semibold text-slate-700 dark:text-slate-200">Task</div>
                    {dateRange.map((date, index) => (
                        <div key={index} ref={el => { dateHeaderRefs.current[index] = el; }} className="text-center border-b border-l border-slate-200 dark:border-slate-700 p-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="font-semibold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div>{formatDate(date)}</div>
                        </div>
                    ))}
                </div>

                {/* Task Rows & Grid Background */}
                <div className="grid" style={{ gridTemplateColumns: `250px repeat(${totalDays}, minmax(60px, 1fr))` }}>
                    {displayTasks.map((task, rowIndex) => {
                        const taskStart = new Date(task.start);
                        const taskEnd = new Date(task.end);
                        let startOffset = daysBetween(gridStartDate, taskStart);
                        let duration = daysBetween(taskStart, taskEnd) + 1;
                        const assignee = users.find(u => u.id === task.assigneeId);

                        const isBeingMoved = interaction?.type === 'move' && (interaction.taskId === task.id || interaction.childTasks.some(c => c.id === task.id));
                        if (isBeingMoved) {
                            startOffset += interaction.daysMoved;
                        }
                        
                        return (
                            <React.Fragment key={task.id}>
                                <div className="sticky left-0 bg-white dark:bg-slate-800 z-10 border-r border-b border-slate-200 dark:border-slate-700 p-2 flex items-center" style={{ gridRow: rowIndex + 1, paddingLeft: `${8 + task.level * 20}px` }}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full flex-shrink-0" title={`Assigned to ${assignee.name}`}/>}
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={task.name}>{task.name}</span>
                                    </div>
                                </div>
                                {Array.from({ length: totalDays }).map((_, i) => (
                                    <div key={i} className="h-14 border-b border-l border-slate-200 dark:border-slate-700/50" style={{ gridColumn: i + 2, gridRow: rowIndex + 1 }}></div>
                                ))}
                                <div 
                                    className={`p-2 h-14 flex items-center z-10 ${isBeingMoved ? 'opacity-50' : ''}`}
                                    style={{ 
                                        gridColumn: `${startOffset + 2} / span ${duration}`,
                                        gridRow: rowIndex + 1,
                                    }}
                                >
                                    <div
                                        ref={el => { taskRefs.current[task.id] = el; }}
                                        className={`group relative w-full h-10 rounded-lg flex items-center px-3 text-white text-sm font-bold border-b-2 shadow-sm truncate transition-transform duration-200 hover:shadow-lg ${getTaskBarStyles(task)}`}
                                        data-task-id={task.id}
                                        onMouseDown={(e) => handleInteractionStart(e, task, 'move')}
                                    >
                                        <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleInteractionStart(e, task, 'resize-start')}></div>
                                        <span className="truncate pointer-events-none">{task.name}</span>
                                        <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleInteractionStart(e, task, 'resize-end')}></div>
                                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-100 dark:bg-slate-600 rounded-full border-2 border-primary-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleInteractionStart(e, task, 'link')}></div>
                                        
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap shadow-lg w-max max-w-xs z-50">
                                            <p className="font-bold">{task.name}</p>
                                            <p className="font-normal">{formatDate(taskStart)} - {formatDate(taskEnd)}</p>
                                            <p className="font-normal">Assignee: {assignee?.name}</p>
                                            <p className="font-normal">Priority: {task.priority || 'Medium'}</p>
                                            {task.description && <p className="font-normal whitespace-pre-wrap mt-1 border-t border-slate-600 pt-1 text-left">{task.description}</p>}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {/* Ghost element for drag feedback */}
                    {interaction?.type === 'move' && (
                        <div className="absolute top-0 h-14 p-2 z-20 pointer-events-none" style={{
                            left: 250 + (daysBetween(gridStartDate, new Date(interaction.initialTask.start)) + interaction.daysMoved) * dayWidthRef.current,
                            width: (daysBetween(new Date(interaction.initialTask.start), new Date(interaction.initialTask.end)) + 1) * dayWidthRef.current,
                            gridRow: displayTasks.findIndex(t => t.id === interaction.taskId) + 1,
                            top: 58 + (displayTasks.findIndex(t => t.id === interaction.taskId)) * 56,
                        }}>
                             <div className="w-full h-10 rounded-lg bg-primary-500/30 border-2 border-dashed border-primary-500"></div>
                        </div>
                    )}
                </div>
                
                {todayMarkerLeft !== null && (
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-20 pointer-events-none"
                        style={{ left: `${250 + todayMarkerLeft}px` }}
                        title={`Today, ${formatDate(new Date())}`}
                    >
                        <div className="sticky top-0 -ml-2 mt-[52px] w-5 h-5 border-2 border-red-500 bg-white dark:bg-slate-800 rounded-full shadow-md"></div>
                    </div>
                )}
                
                <svg className="absolute top-[58px] left-0 w-full h-full pointer-events-none z-20">
                    <defs>
                        <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="4" refY="1.75" orient="auto">
                            <polygon points="0 0, 5 1.75, 0 3.5" fill="#94a3b8" />
                        </marker>
                    </defs>
                    {dependencyLines.map(line => (
                        <path
                            key={line.id}
                            d={line.path}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                            className="opacity-75"
                        />
                    ))}
                    {interaction?.type === 'link' && (
                         <path
                            d={`M ${interaction.fromX} ${interaction.fromY} L ${interaction.toX} ${interaction.toY}`}
                            stroke="#4f46e5"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            fill="none"
                        />
                    )}
                </svg>
              </div>
            </div>
    );
    
    const renderListView = () => (
        <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md no-print">
                <div className="flex justify-end">
                    <div className="flex items-center gap-2">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Status:</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | Task['status'])}
                            className="w-40 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Task</th>
                            <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Assignee</th>
                            <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Timeline</th>
                            <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Priority</th>
                            <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => {
                                const assignee = users.find(u => u.id === task.assigneeId);
                                const dependencyNames = task.dependencies
                                    .map(depId => tasks.find(t => t.id === depId)?.name)
                                    .filter(Boolean)
                                    .join(', ');

                                return (
                                    <tr key={task.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-medium text-slate-900 dark:text-white" style={{ paddingLeft: `${16 + task.level * 24}px` }} title={task.description}>
                                            {task.name}
                                            {dependencyNames && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Depends on: {dependencyNames}</div>}
                                        </td>
                                        <td className="p-4">
                                            {assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full"/>
                                                    <span className="text-sm text-slate-600 dark:text-slate-300">{assignee.name}</span>
                                                </div>
                                            ) : <span className="text-sm text-slate-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(new Date(task.start))} - {formatDate(new Date(task.end))}
                                        </td>
                                        <td className="p-4"><PriorityBadge priority={task.priority} /></td>
                                        <td className="p-4"><StatusBadge status={task.status} /></td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-400">
                                    No tasks found matching your filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Scheduler</h1>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex items-center">
                        <button onClick={() => setViewMode('gantt')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-600 dark:text-slate-300'}`}>Gantt</button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-600 dark:text-slate-300'}`}>List</button>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>Create Task</span>
                    </button>
                </div>
            </div>
            
            {viewMode === 'gantt' ? renderGanttView() : renderListView()}

            <CreateTaskModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onAddTask}
                users={users}
                tasks={tasks}
            />
        </div>
    );
};