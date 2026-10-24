export type JobCategory = 'moving' | 'farming';
export type JobStatus = 'matching' | 'confirmed' | 'in-progress' | 'needs-attention' | 'completed';
export type WorkerOfferStatus = 'offered' | 'accepted' | 'declined';
export type WorkerArrivalStatus = 'not-set' | 'on-the-way' | 'arrived';
export type CropCondition = 'light' | 'average' | 'dense';
export type HarvestMethod = 'manual' | 'assisted';
export type CustomerStep = 'home' | 'clarify' | 'proposal' | 'jobs' | 'tracker';

export interface JobRequest {
    category: JobCategory;
    description: string;
    location: string;
    origin: string;
    destination: string;
    date: string;
    startTime: string;
    deadline: string;
    scale: number;
    cropCondition: CropCondition | '';
    harvestMethod: HarvestMethod | '';
    budgetCap: number | null;
    equipment: string[];
    notes: string;
}

export interface JobStep {
    id: string;
    title: string;
    time: string;
    done: boolean;
}

export interface WorkerProfile {
    id: string;
    name: string;
    initials: string;
    skills: string[];
    serviceAreas: string[];
    hourlyRate: number;
    verified: boolean;
    rating: number;
    completedJobs: number;
    availability: string;
    availableDays: string[];
    experienceYears: number;
    bio: string;
}

export interface WorkerMatch {
    workerId: string;
    status: WorkerOfferStatus;
    arrival: WorkerArrivalStatus;
}

export interface JobPlan extends JobRequest {
    id: string;
    teamSize: number;
    requiredSkills: string[];
    estimatedHours: number;
    estimatedCostLow: number;
    estimatedCostHigh: number;
    equipmentList: string[];
    tasks: JobStep[];
    backupPlan: string;
    matches: WorkerMatch[];
    status: JobStatus;
    issue: string;
}

export interface WorkerSettings {
    workerId: string;
    serviceArea: string;
    hourlyRate: number;
    availableDays: string[];
    skills: string[];
}