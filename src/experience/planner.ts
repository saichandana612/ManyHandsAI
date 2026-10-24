import { sampleWorkers } from './sampleWorkers';
import type { CropCondition, JobCategory, JobPlan, JobRequest, WorkerMatch, WorkerProfile } from './types';

const coreSkills: Record<JobCategory, string[]> = {
    moving: ['House moves', 'Furniture handling'],
    farming: ['Paddy harvesting'],
};

const equipmentByCategory: Record<JobCategory, string[]> = {
    moving: ['Box truck', 'Moving blankets', 'Hand truck'],
    farming: ['Harvest crates', 'Field tools', 'Water station'],
};

const taskNames: Record<JobCategory, string[]> = {
    moving: ['Protect floors and confirm the inventory', 'Load, secure, and transport belongings', 'Unload by room and complete a walkthrough'],
    farming: ['Check field conditions and prepare the crew', 'Harvest in coordinated rows', 'Sort, shade, and stage the crop'],
};

const backupPlans: Record<JobCategory, string> = {
    moving: 'Hold one helper in reserve during loading. If the vehicle is delayed, stage sealed boxes near the exit and shift the unload window.',
    farming: 'If weather or field conditions change, pause exposed work and move to sheltered sorting. Keep a reserve shift for the next clear window.',
};

export function requiredClarifications(request: JobRequest): string[] {
    const quantityStep = request.category === 'farming' ? 0.5 : 1;
    const missing: string[] = [];
    if (!request.description.trim()) missing.push('task description');
    if (!Number.isFinite(request.scale) || request.scale < quantityStep || request.scale > 100
        || Math.abs(request.scale / quantityStep - Math.round(request.scale / quantityStep)) >= 0.000001) {
        missing.push(request.category === 'farming' ? 'acreage to harvest' : 'home size');
    }
    if (request.category === 'farming') {
        if (!request.location.trim()) missing.push('farm location');
        if (!request.date) missing.push('exact date');
        else if (request.date < dateOffset(0)) missing.push('a date on or after today');
        if (!request.startTime) missing.push('preferred start time');
        if (!request.cropCondition) missing.push('crop condition');
        if (!request.harvestMethod) missing.push('harvesting method');
    } else {
        if (!request.origin.trim()) missing.push('pickup address');
        if (!request.destination.trim()) missing.push('delivery address');
        if (!request.date) missing.push('exact date');
        else if (request.date < dateOffset(0)) missing.push('a date on or after today');
        if (!request.startTime) missing.push('preferred start time');
    }
    if (request.deadline && request.startTime && request.deadline <= request.startTime) missing.push('a finish time after the start');
    if (request.budgetCap !== null && (!Number.isFinite(request.budgetCap) || request.budgetCap <= 0)) missing.push('a valid budget ceiling');
    return missing;
}

export function detectCategory(description: string): JobCategory {
    return /paddy|harvest|acre|farm|rice/i.test(description) ? 'farming' : 'moving';
}

export function detectScale(description: string): number {
    const match = description.match(/(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight)\s*[- ]?\s*(?:acres?|bedrooms?|rooms?)/i);
    if (!match) return 0;
    const wordValues: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    return wordValues[match[1].toLowerCase()] ?? Number(match[1]);
}

function isInServiceArea(worker: WorkerProfile, location: string): boolean {
    const normalizedLocation = location.toLowerCase();
    return worker.serviceAreas.some((area) => normalizedLocation.includes(area.toLowerCase()));
}

function addMinutes(time: string, minutes: number): string {
    const [hours, remainder] = time.split(':').map(Number);
    const total = (hours * 60 + remainder + minutes) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function createJobPlan(request: JobRequest): JobPlan {
    const cropCondition: CropCondition = request.cropCondition || 'average';
    const cropFactor = cropCondition === 'dense' ? 1.35 : cropCondition === 'light' ? 0.85 : 1;
    const assisted = request.harvestMethod === 'assisted';
    const teamSize = request.category === 'moving'
        ? Math.max(2, Math.ceil(request.scale) + 2)
        : Math.max(3, Math.ceil(request.scale * 2 * (cropCondition === 'dense' ? 1.35 : 1) * (assisted ? 0.8 : 1)));
    const estimatedHours = request.category === 'moving'
        ? Math.max(4, Math.ceil(request.scale * 2 + 2))
        : Math.max(4, Math.ceil(request.scale * 2.5 * cropFactor / (assisted ? 0.8 : 1)));
    const skills = request.category === 'farming'
        ? [...coreSkills.farming, assisted ? 'Assisted harvest' : 'Manual harvest']
        : coreSkills.moving;
    const workerLocation = request.category === 'moving' ? `${request.origin} ${request.destination}` : request.location;
    const requestedDay = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(`${request.date}T12:00:00`));
    const candidates = sampleWorkers.filter((worker) => skills.every((skill) => worker.skills.includes(skill))
        && worker.availableDays.includes(requestedDay)
        && isInServiceArea(worker, workerLocation));
    const sortedWorkers = [...candidates].sort((first, second) => {
        return Number(second.verified) - Number(first.verified) || second.rating - first.rating || first.hourlyRate - second.hourlyRate;
    });
    const rates = candidates.map((worker) => worker.hourlyRate);
    const lowRate = rates.length ? Math.min(...rates) : (request.category === 'farming' ? 21 : 29);
    const highRate = rates.length ? Math.max(...rates) : (request.category === 'farming' ? 27 : 35);
    const equipmentCost = request.category === 'moving' ? 220 : 135;
    const totalLow = teamSize * estimatedHours * lowRate + equipmentCost;
    const totalHigh = teamSize * estimatedHours * highRate + equipmentCost;
    const tasks = taskNames[request.category].map((title, index) => ({
        id: `task-${index + 1}`,
        title,
        time: addMinutes(request.startTime, [0, Math.round(estimatedHours * 30), estimatedHours * 60][index]),
        done: false,
    }));
    const location = request.category === 'moving' ? `${request.origin} to ${request.destination}` : request.location;

    return {
        ...request,
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        teamSize,
        requiredSkills: skills,
        estimatedHours,
        estimatedCostLow: Math.round(totalLow / 10) * 10,
        estimatedCostHigh: Math.round(totalHigh / 10) * 10,
        equipmentList: [...new Set([...equipmentByCategory[request.category], ...request.equipment])],
        tasks,
        backupPlan: backupPlans[request.category],
        matches: sortedWorkers.map((worker): WorkerMatch => ({ workerId: worker.id, status: 'offered', arrival: 'not-set' })),
        status: 'matching',
        location,
        issue: '',
    };
}

export function formatTime(time: string): string {
    if (!time) return 'Time to confirm';
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
    if (!date) return 'Date to confirm';
    return new Intl.DateTimeFormat('en', options).format(new Date(`${date}T12:00:00`));
}

export function dateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function sampleJobs(): JobPlan[] {
    const examples: Array<{ request: JobRequest; status: JobPlan['status']; done: number; accepted: number }> = [
        {
            request: {
                category: 'farming', description: 'I need help harvesting two acres of paddy. I need workers who have done this before.',
                location: 'Greenbank Farm, East Field', origin: '', destination: '', date: dateOffset(7), startTime: '07:00',
                deadline: '14:00', scale: 2, cropCondition: 'average', harvestMethod: 'manual', budgetCap: 1200,
                equipment: ['Shade tent'], notes: 'Keep picked crop shaded.',
            },
            status: 'matching', done: 0, accepted: 0,
        },
        {
            request: {
                category: 'moving', description: 'Move a two-bedroom home across North Park.', location: '',
                origin: '18 Willow Lane, North Park', destination: '42 Elm Street, North Park', date: dateOffset(14),
                startTime: '09:00', deadline: '', scale: 2, cropCondition: '', harvestMethod: '', budgetCap: null,
                equipment: ['Wardrobe boxes'], notes: 'Apartment stairs; loading bay reserved until noon.',
            },
            status: 'confirmed', done: 0, accepted: 4,
        },
        {
            request: {
                category: 'moving', description: 'Help move a studio and set up a bed frame.', location: '',
                origin: 'Willow Lane, North Park', destination: 'Riverside Apartments', date: dateOffset(0),
                startTime: '08:00', deadline: '', scale: 1, cropCondition: '', harvestMethod: '', budgetCap: null,
                equipment: [], notes: 'One fragile mirror.',
            },
            status: 'in-progress', done: 1, accepted: 3,
        },
        {
            request: {
                category: 'farming', description: 'Experienced manual harvest crew for dense paddy crop.',
                location: 'Greenbank Farm', origin: '', destination: '', date: dateOffset(-7), startTime: '06:30',
                deadline: '', scale: 1, cropCondition: 'dense', harvestMethod: 'manual', budgetCap: null,
                equipment: [], notes: '',
            },
            status: 'completed', done: 3, accepted: 3,
        },
    ];
    return examples.map(({ request, status, done, accepted }) => {
        const plan = createJobPlan(request);
        return {
            ...plan,
            status,
            matches: plan.matches.map((match, index) => ({
                ...match,
                status: index < accepted ? 'accepted' : match.status,
                arrival: status === 'in-progress' && index === 0 ? 'arrived' : match.arrival,
            })),
            tasks: plan.tasks.map((task, index) => ({ ...task, done: index < done })),
        };
    });
}