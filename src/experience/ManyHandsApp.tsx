import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleHelp,
    Clock3,
    MapPin,
    MessageCircleMore,
    MoveRight,
    Plus,
    Search,
    ShieldCheck,
    Sprout,
    Star,
    Truck,
    UsersRound,
    WalletCards,
    Wrench,
} from 'lucide-react';
import { createJobPlan, dateOffset, detectCategory, detectScale, formatDate, formatTime, requiredClarifications, sampleJobs } from './planner';
import { initialWorkerSettings, sampleWorkers } from './sampleWorkers';
import type { CustomerStep, JobCategory, JobPlan, JobRequest, JobStatus, WorkerArrivalStatus, WorkerSettings } from './types';

import './experience.css';

const categoryCards: Array<{ category: JobCategory; label: string; description: string; icon: typeof Truck; image: string; prompt: string }> = [
    {
        category: 'moving', label: 'House move', description: 'A careful crew, vehicle, and a plan for every box.', icon: Truck,
        image: 'https://images.openai.com/static-rsc-4/yXd_fRi40ORnj0BA9yWZejXW9ezT5d9k7u3VZXFeOrIZWD3I52AbfHN6zx--tAdygFi0NWloBikVHdLyfSHmsGqUKl66gOo3UlbI6jIJOfP4300jLziPkH-5rjcsr4iutJzYGrc--pl0fgbc6eGFXGR9JOixdzz54k4p_Zfxuh_-sIyGjtfkmBmhCskz16Lm?purpose=inline',
        prompt: 'I need help moving a two-bedroom home this Saturday.',
    },
    {
        category: 'farming', label: 'Paddy harvest', description: 'Experienced field workers, equipment, and a weather-aware schedule.', icon: Sprout,
        image: 'https://images.openai.com/static-rsc-4/MJ0smetskEv3ZKU69aW6m6U2_7CpKDt4MW6riaw1NM1ruyJGaoqJ7kIpid9XTVHNvywzoAmTJxloT2aLza_nLSTmJjwlUwFclbNlJvvjtQ537WMWatx4wapJ0KaurPsZMWksaqTB9DkkRk3q3STyIhoDlgcDOvX21PAWWxHpuWg?purpose=inline',
        prompt: 'I need help harvesting two acres of paddy on Saturday. I need workers who have done this before.',
    },
];

const skillOptions = ['House moves', 'Furniture handling', 'Packing', 'Driving', 'Paddy harvesting', 'Manual harvest', 'Assisted harvest', 'Field lead', 'Produce sorting'];
const dayOptions = ['Friday', 'Saturday', 'Sunday', 'Monday'];

const emptyRequest = (category: JobCategory, description = ''): JobRequest => ({
    category,
    description,
    location: '',
    origin: '',
    destination: '',
    date: '',
    startTime: '',
    deadline: '',
    scale: detectScale(description),
    cropCondition: '',
    harvestMethod: '',
    budgetCap: null,
    equipment: [],
    notes: '',
});

function readJobs(): JobPlan[] {
    try {
        const saved = localStorage.getItem('manyhands-v2-jobs');
        if (saved) return JSON.parse(saved) as JobPlan[];
    } catch {
        localStorage.removeItem('manyhands-v2-jobs');
    }
    return sampleJobs();
}

function readWorkerSettings(): WorkerSettings {
    try {
        const saved = localStorage.getItem('manyhands-v2-worker');
        if (saved) return JSON.parse(saved) as WorkerSettings;
    } catch {
        localStorage.removeItem('manyhands-v2-worker');
    }
    return initialWorkerSettings;
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function statusText(status: JobStatus): string {
    const labels: Record<JobStatus, string> = {
        matching: 'Matching team',
        confirmed: 'Team confirmed',
        'in-progress': 'In progress',
        'needs-attention': 'Needs attention',
        completed: 'Completed',
    };
    return labels[status];
}

function categoryName(category: JobCategory): string {
    return category === 'farming' ? 'Paddy harvest' : 'House move';
}

function AppHeader({ mode, onModeChange, page, onPageChange }: {
    mode: 'customer' | 'worker' | 'admin';
    onModeChange: (mode: 'customer' | 'worker' | 'admin') => void;
    page: CustomerStep;
    onPageChange: (page: CustomerStep) => void;
}) {
    return (
        <header className="experience-header">
            <a className="experience-brand" href="#home" onClick={(event) => { event.preventDefault(); onPageChange('home'); }}>
                <span className="experience-brand-mark"><i /><i /><i /></span>
                <span>ManyHands<span className="brand-ai-text">AI</span></span>
            </a>
            <nav className="experience-main-nav" aria-label="Main navigation">
                <button className={mode === 'customer' && page !== 'jobs' && page !== 'tracker' ? 'active' : ''} onClick={() => { onModeChange('customer'); onPageChange('home'); }}>Find help</button>
                <button className={mode === 'customer' && (page === 'jobs' || page === 'tracker') ? 'active' : ''} onClick={() => { onModeChange('customer'); onPageChange('jobs'); }}>My jobs</button>
            </nav>
            <div className="role-toggle" role="group" aria-label="Preview as">
                <button className={mode === 'customer' ? 'active' : ''} onClick={() => onModeChange('customer')}>Customer</button>
                <button className={mode === 'worker' ? 'active' : ''} onClick={() => onModeChange('worker')}>Worker</button>
                <button className={mode === 'admin' ? 'active' : ''} onClick={() => onModeChange('admin')}>Admin</button>
            </div>
        </header>
    );
}

function HomeScreen({ onStart, onQuickStart }: { onStart: (description: string, category: JobCategory) => void; onQuickStart: (description: string, category: JobCategory) => void }) {
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<JobCategory>('moving');
    const [error, setError] = useState('');

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!description.trim()) {
            setError('Describe the task to get started.');
            return;
        }
        const inferredCategory = /paddy|harvest|acre|farm|rice/i.test(description) ? detectCategory(description) : selectedCategory;
        onStart(description.trim(), inferredCategory);
    }

    return (
        <main className="customer-home">
            <div className="home-sprig home-sprig-one" />
            <div className="home-sprig home-sprig-two" />
            <div className="home-kicker"><span /> PRACTICAL HELP, THOUGHTFULLY COORDINATED</div>
            <h1>Tell us what you need done.<br /><em>We’ll help organize it.</em></h1>
            <p className="home-intro">One clear request. The right people, tools, and timing. A job that gets over the line.</p>
            <form className="home-request-box" onSubmit={submit}>
                <label htmlFor="task-description">What do you need help with?</label>
                <textarea id="task-description" value={description} onChange={(event) => { setDescription(event.target.value); setError(''); }} placeholder="Try “I need help harvesting two acres of paddy this Saturday...”" rows={3} maxLength={500} />
                <div className="home-request-footer"><span><MessageCircleMore size={15} /> A few quick questions help shape a reliable plan.</span><button className="experience-primary" type="submit">Plan my job <ArrowRight size={16} /></button></div>
                {error && <p className="home-form-error" role="alert">{error}</p>}
            </form>
            <div className="quick-start-heading"><span>OR START WITH A TASK</span><i /></div>
            <div className="quick-start-grid">
                {categoryCards.map((card) => {
                    const Icon = card.icon;
                    return <button className="quick-start-card" key={card.category} onClick={() => { setSelectedCategory(card.category); onQuickStart(card.prompt, card.category); }}>
                        <img src={card.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                        <span className="quick-card-shade" />
                        <span className="quick-card-copy"><span className="quick-card-icon"><Icon size={16} /></span><strong>{card.label}</strong><small>{card.description}</small><i><ArrowRight size={15} /></i></span>
                    </button>;
                })}
            </div>
            <div className="home-trust-row"><span><ShieldCheck size={15} /> You approve every plan</span><span><UsersRound size={15} /> Skills-first matching</span><span><CircleHelp size={15} /> No booking until you say so</span></div>
        </main>
    );
}

function ClarifyScreen({ request, onChange, onBack, onBuild }: {
    request: JobRequest;
    onChange: (key: keyof JobRequest, value: JobRequest[keyof JobRequest]) => void;
    onBack: () => void;
    onBuild: () => void;
}) {
    const missing = requiredClarifications(request);
    const category = request.category;
    const equipmentOptions = category === 'farming'
        ? ['Harvest crates', 'Shade tent', 'Water station', 'Field tools']
        : ['Wardrobe boxes', 'Packing materials', 'Furniture disassembly', 'Fragile-item handling'];
    const canBuild = missing.length === 0 && request.description.trim().length > 0;

    function update(key: keyof JobRequest, value: JobRequest[keyof JobRequest]) {
        onChange(key, value);
    }

    function toggleEquipment(item: string) {
        const current = request.equipment;
        update('equipment', current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
    }

    return (
        <main className="flow-screen">
            <button className="experience-back" onClick={onBack}><ArrowLeft size={15} /> Back to your request</button>
            <div className="flow-progress"><span className="complete" /><span className="active" /><span /><span /></div>
            <div className="conversation-layout">
                <section className="conversation-column">
                    <div className="assistant-heading"><span className="assistant-avatar"><MessageCircleMore size={17} /></span><div><strong>Your job assistant</strong><small>Planning together · local preview</small></div></div>
                    <div className="chat-transcript" aria-live="polite">
                        <div className="chat-bubble customer-bubble"><span>You</span><p>{request.description}</p></div>
                        <div className="chat-bubble assistant-bubble"><span><i /> ManyHands assistant</span><p>I’ve picked up the task type and scale. Before I suggest a team, I need a few details that change who’s suitable and how long the work may take.</p>
                            {missing.length > 0 && <div className="missing-points"><strong>Still to clarify</strong>{missing.map((item) => <span key={item}><CircleHelp size={12} />{item}</span>)}</div>}
                        </div>
                        <div className="assistant-disclaimer"><ShieldCheck size={14} /> No worker is contacted until you review the plan.</div>
                    </div>
                </section>
                <section className="clarification-card">
                    <div className="clarification-card-heading"><span>STEP 1 OF 3</span><h2>Let’s fill in the gaps.</h2><p>Only the details needed to estimate and match this job.</p></div>
                    <div className="clarification-form">
                        {category === 'farming' ? <>
                            <label className="experience-field field-span"><span>Farm location</span><span className="experience-input-icon"><MapPin size={15} /><input value={request.location} onChange={(event) => update('location', event.target.value)} placeholder="Farm, field, or nearby town" /></span></label>
                        </> : <>
                            <label className="experience-field"><span>Pickup address</span><span className="experience-input-icon"><MapPin size={15} /><input value={request.origin} onChange={(event) => update('origin', event.target.value)} placeholder="Where are we starting?" /></span></label>
                            <label className="experience-field"><span>Delivery address</span><span className="experience-input-icon"><MapPin size={15} /><input value={request.destination} onChange={(event) => update('destination', event.target.value)} placeholder="Where are things going?" /></span></label>
                        </>}
                        <label className="experience-field"><span>Exact date</span><span className="experience-input-icon"><CalendarDays size={15} /><input type="date" min={dateOffset(0)} value={request.date} onChange={(event) => update('date', event.target.value)} /></span></label>
                        <label className="experience-field"><span>Preferred start time</span><span className="experience-input-icon"><Clock3 size={15} /><input type="time" value={request.startTime} onChange={(event) => update('startTime', event.target.value)} /></span></label>
                        {category === 'farming' ? <>
                            <label className="experience-field"><span>How is the crop looking?</span><select value={request.cropCondition} onChange={(event) => update('cropCondition', event.target.value as JobRequest['cropCondition'])}><option value="">Choose crop density</option><option value="light">Light</option><option value="average">Average</option><option value="dense">Dense</option></select></label>
                            <label className="experience-field"><span>Harvesting method</span><select value={request.harvestMethod} onChange={(event) => update('harvestMethod', event.target.value as JobRequest['harvestMethod'])}><option value="">Choose a method</option><option value="manual">Manual harvest</option><option value="assisted">Assisted harvest</option></select></label>
                        </> : <label className="experience-field"><span>Home size</span><span className="experience-input-icon"><input type="number" min="1" max="8" step="1" value={request.scale} onChange={(event) => update('scale', Number(event.target.value))} /><small>bedrooms</small></span></label>}
                        {category === 'farming' && <label className="experience-field"><span>Acres to harvest</span><span className="experience-input-icon"><input type="number" min="0.5" max="100" step="0.5" value={request.scale} onChange={(event) => update('scale', Number(event.target.value))} /><small>acres</small></span></label>}
                        <label className="experience-field"><span>Finish by <small>Optional</small></span><span className="experience-input-icon"><Clock3 size={15} /><input type="time" value={request.deadline} onChange={(event) => update('deadline', event.target.value)} /></span></label>
                        <label className="experience-field"><span>Budget ceiling <small>Optional</small></span><span className="experience-input-icon"><WalletCards size={15} /><input type="number" min="0" step="25" value={request.budgetCap ?? ''} onChange={(event) => update('budgetCap', event.target.value ? Number(event.target.value) : null)} placeholder="No limit set" /><small>USD</small></span></label>
                        <fieldset className="equipment-fieldset field-span"><legend>Equipment you already have <small>Optional</small></legend><div className="equipment-checks">{equipmentOptions.map((item) => <label key={item} className={request.equipment.includes(item) ? 'checked' : ''}><input type="checkbox" checked={request.equipment.includes(item)} onChange={() => toggleEquipment(item)} /><span><Check size={11} /></span>{item}</label>)}</div></fieldset>
                        <label className="experience-field field-span"><span>Anything else to plan around? <small>Optional</small></span><textarea rows={2} maxLength={240} value={request.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Access restrictions, fragile items, weather or safety notes" /></label>
                    </div>
                    <div className="clarification-actions"><span>{missing.length ? `${missing.length} details still needed` : 'Enough detail to build a draft plan'}</span><button className="experience-primary" disabled={!canBuild} onClick={onBuild}>Build the plan <ArrowRight size={15} /></button></div>
                </section>
            </div>
        </main>
    );
}

function WorkerCard({ worker, status, onAction }: { worker: (typeof sampleWorkers)[number]; status: string; onAction?: () => void }) {
    return <article className="worker-match-card"><span className={`worker-initials initials-${worker.id}`}>{worker.initials}</span><div className="worker-match-main"><div className="worker-name-row"><strong>{worker.name}</strong>{worker.verified && <span className="verified-tag"><BadgeCheck size={12} /> Verified</span>}</div><span className="worker-skill-line">{worker.skills.slice(0, 2).join(' · ')}</span><span className="worker-area-line"><MapPin size={12} />{worker.serviceAreas.join(', ')}</span><span className="worker-bio">{worker.bio}</span></div><div className="worker-match-aside"><span className="worker-rating"><Star size={12} fill="currentColor" /> {worker.rating} <small>({worker.completedJobs})</small></span><strong>{formatMoney(worker.hourlyRate)}<small> / hr</small></strong><span className="worker-availability">{worker.availability}</span>{onAction && <button className={`worker-action ${status === 'accepted' ? 'action-accepted' : ''}`} onClick={onAction}>{status === 'accepted' ? <><Check size={13} /> Accepted</> : status === 'declined' ? 'Declined' : 'Request worker'}</button>}</div></article>;
}

function ProposalScreen({ plan, onBack, onSave }: { plan: JobPlan; onBack: () => void; onSave: () => void }) {
    const workers = plan.matches.map((match) => ({ match, worker: sampleWorkers.find((candidate) => candidate.id === match.workerId) })).filter((item): item is { match: JobPlan['matches'][number]; worker: (typeof sampleWorkers)[number] } => Boolean(item.worker));
    const slotsOpen = Math.max(0, plan.teamSize - workers.filter(({ match }) => match.status === 'accepted').length);
    const underBudget = plan.budgetCap !== null && plan.estimatedCostHigh > plan.budgetCap;
    return <main className="proposal-screen">
        <button className="experience-back" onClick={onBack}><ArrowLeft size={15} /> Edit details</button>
        <div className="flow-progress"><span className="complete" /><span className="complete" /><span className="active" /><span /></div>
        <div className="proposal-header"><div><span className="proposal-kicker">STEP 2 OF 3 <i /> DRAFT, NOT A BOOKING</span><h1>Your job plan, <em>taking shape.</em></h1><p>Review the estimate and suggested skill matches. No one has been booked.</p></div><span className="proposal-status">LOCAL PLAN <span /></span></div>
        <section className="proposal-summary"><div className="proposal-job-icon">{plan.category === 'farming' ? <Sprout size={22} /> : <Truck size={22} />}</div><div className="proposal-job-copy"><span>{categoryName(plan.category)} <i /> {formatDate(plan.date)} <i /> {formatTime(plan.startTime)}</span><h2>{plan.description}</h2><p><MapPin size={13} />{plan.category === 'moving' ? <>{plan.origin} <MoveRight size={13} /> {plan.destination}</> : plan.location}</p></div><span className="proposal-scale">{plan.scale} {plan.category === 'farming' ? 'acres' : 'bedrooms'}</span></section>
        <div className="proposal-metrics"><div><span className="metric-icon"><UsersRound size={17} /></span><div><small>Suggested team</small><strong>{plan.teamSize} people</strong></div></div><div><span className="metric-icon"><Clock3 size={17} /></span><div><small>Time estimate</small><strong>About {plan.estimatedHours} hours</strong></div></div><div><span className="metric-icon"><WalletCards size={17} /></span><div><small>Indicative total</small><strong>{formatMoney(plan.estimatedCostLow)}–{formatMoney(plan.estimatedCostHigh)}</strong></div></div><div><span className="metric-icon"><Wrench size={17} /></span><div><small>Equipment</small><strong>{plan.equipmentList.length} items</strong></div></div></div>
        {underBudget && <div className="budget-warning"><AlertTriangle size={16} /><span>Your budget ceiling is below the high estimate. You can still save this plan, but the team size or scope may need adjusting.</span></div>}
        <div className="proposal-columns"><section className="proposal-panel"><div className="proposal-panel-heading"><div><span className="proposal-kicker">POTENTIAL MATCHES</span><h3>People with the right skills</h3></div><span className="match-count"><UsersRound size={13} /> {workers.length} profiles</span></div><p className="panel-subtitle">Ranked by required skills, service area, and profile signals. Availability is not confirmed.</p><div className="match-list">{workers.slice(0, 4).map(({ match, worker }) => <WorkerCard key={worker.id} worker={worker} status={match.status} />)}</div><div className="open-slots"><span className="slot-mark"><UsersRound size={15} /></span><span><strong>{slotsOpen} of {plan.teamSize} places still need confirmation</strong><small>Workers must accept before a team is considered confirmed.</small></span><span className="slot-count">{slotsOpen.toString().padStart(2, '0')}</span></div></section>
            <aside className="proposal-side"><section className="proposal-panel task-panel"><span className="proposal-kicker">RUN OF SHOW</span><h3>Suggested sequence</h3><ol className="proposal-task-list">{plan.tasks.map((task, index) => <li key={task.id}><span>0{index + 1}</span><div><strong>{task.title}</strong><small>{formatTime(task.time)}</small></div></li>)}</ol></section><section className="proposal-panel"><span className="proposal-kicker">REQUIRED SKILLS</span><div className="skill-tags">{plan.requiredSkills.map((skill) => <span key={skill}><Check size={11} />{skill}</span>)}</div><span className="proposal-kicker equipment-kicker">EQUIPMENT</span><div className="proposal-equipment">{plan.equipmentList.map((item) => <span key={item}>{item}</span>)}</div></section><section className="backup-card"><AlertTriangle size={16} /><div><strong>Plan for a change of pace</strong><p>{plan.notes || plan.backupPlan}</p></div></section></aside></div>
        <div className="proposal-bottom"><span><ShieldCheck size={15} /> This estimate uses sample rates and local rules.</span><button className="experience-primary" onClick={onSave}>Save plan &amp; track matches <ArrowRight size={15} /></button></div>
    </main>;
}

function JobsScreen({ jobs, onSelect, onStart }: { jobs: JobPlan[]; onSelect: (job: JobPlan) => void; onStart: () => void }) {
    const [query, setQuery] = useState('');
    const filtered = jobs.filter((job) => `${job.description} ${job.location} ${job.origin} ${job.destination}`.toLowerCase().includes(query.toLowerCase())).sort((first, second) => first.date.localeCompare(second.date));
    return <main className="jobs-screen"><div className="jobs-heading"><div><span className="proposal-kicker">CUSTOMER WORKROOM</span><h1>All the moving parts.</h1><p>Plans, matches, and work already underway.</p></div><button className="experience-primary" onClick={onStart}><Plus size={15} /> New request</button></div><div className="job-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your jobs" /></div><div className="customer-job-list">{filtered.length ? filtered.map((job) => <button key={job.id} className="customer-job-row" onClick={() => onSelect(job)}><span className={`job-type-icon ${job.category}`}>{job.category === 'farming' ? <Sprout size={18} /> : <Truck size={18} />}</span><span className="customer-job-copy"><small>{categoryName(job.category)} <i /> {formatDate(job.date)}</small><strong>{job.description}</strong><span>{job.category === 'moving' ? `${job.origin} → ${job.destination}` : job.location}</span></span><span className={`job-status-pill status-${job.status}`}>{statusText(job.status)}</span><span className="customer-job-arrow"><ArrowRight size={16} /></span></button>) : <div className="empty-jobs"><span><Search size={20} /></span><strong>No jobs match that search.</strong><small>Try a different task or location.</small></div>}</div><div className="sample-data-note"><ShieldCheck size={15} /><span>Sample profiles and local estimates. No real bookings, worker contact, or payments.</span></div></main>;
}

function TrackerScreen({ job, onBack, onTaskToggle, onArrival, onIssue, onComplete }: {
    job: JobPlan;
    onBack: () => void;
    onTaskToggle: (taskId: string) => void;
    onArrival: (workerId: string, arrival: WorkerArrivalStatus) => void;
    onIssue: (message: string) => void;
    onComplete: () => void;
}) {
    const [issueText, setIssueText] = useState('');
    const [reporting, setReporting] = useState(false);
    const accepted = job.matches.filter((match) => match.status === 'accepted');
    const completeTasks = job.tasks.filter((task) => task.done).length;
    const taskProgress = Math.round(completeTasks / job.tasks.length * 100);
    return <main className="tracker-screen"><button className="experience-back" onClick={onBack}><ArrowLeft size={15} /> All jobs</button><div className="flow-progress"><span className="complete" /><span className="complete" /><span className="complete" /><span className="active" /></div><div className="tracker-heading"><div><span className="proposal-kicker">STEP 3 OF 3 <i /> JOB TRACKER</span><h1>Keep the work <em>moving.</em></h1><p>{job.description}</p></div><span className={`job-status-pill status-${job.status}`}>{statusText(job.status)}</span></div>
        <section className="tracker-overview"><div><span>JOB DATE</span><strong><CalendarDays size={15} /> {formatDate(job.date, { weekday: 'long', month: 'long', day: 'numeric' })}</strong></div><div><span>START TIME</span><strong><Clock3 size={15} /> {formatTime(job.startTime)}</strong></div><div><span>TEAM STATUS</span><strong><UsersRound size={15} /> {accepted.length} of {job.teamSize} confirmed</strong></div><div><span>ESTIMATED TOTAL</span><strong><WalletCards size={15} /> {formatMoney(job.estimatedCostLow)}–{formatMoney(job.estimatedCostHigh)}</strong></div></section>
        {job.status === 'needs-attention' && <div className="tracker-issue"><AlertTriangle size={16} /><div><strong>Issue reported</strong><p>{job.issue}</p></div><button onClick={() => onIssue('')}>Resolve issue</button></div>}
        <div className="tracker-columns"><section className="tracker-panel"><div className="tracker-panel-heading"><div><span className="proposal-kicker">TEAM CONFIRMATIONS</span><h2>Worker responses</h2></div><span className="tracker-count">{accepted.length} / {job.teamSize}</span></div><div className="tracker-worker-list">{job.matches.map((match) => {
            const worker = sampleWorkers.find((candidate) => candidate.id === match.workerId);
            if (!worker) return null;
            return <div className="tracker-worker" key={worker.id}><span className={`worker-initials initials-${worker.id}`}>{worker.initials}</span><span className="tracker-worker-name"><strong>{worker.name}</strong><small>{worker.skills[0]} · {worker.availability}</small></span><span className={`response-state response-${match.status}`}>{match.status === 'accepted' ? <><CheckCircle2 size={13} /> Confirmed</> : match.status === 'declined' ? 'Declined' : 'Awaiting reply'}</span>{match.status === 'accepted' && <select aria-label={`${worker.name} arrival status`} value={match.arrival} onChange={(event) => onArrival(worker.id, event.target.value as WorkerArrivalStatus)}><option value="not-set">Arrival not set</option><option value="on-the-way">On the way</option><option value="arrived">Arrived</option></select>}</div>;
        })}</div>{accepted.length < job.teamSize && <div className="unfilled-notice"><UsersRound size={15} /><span><strong>{job.teamSize - accepted.length} places still open</strong><small>Keep matching, or adjust your plan before confirming a full team.</small></span></div>}</section>
            <section className="tracker-panel progress-panel"><div className="tracker-panel-heading"><div><span className="proposal-kicker">COMPLETION</span><h2>Job progress</h2></div><span className="tracker-count">{completeTasks}/{job.tasks.length}</span></div><div className="tracker-progress"><span style={{ width: `${taskProgress}%` }} /></div><ol className="tracker-task-list">{job.tasks.map((task) => <li key={task.id} className={task.done ? 'done' : ''}><button aria-label={`${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`} onClick={() => onTaskToggle(task.id)}>{task.done ? <Check size={13} /> : <span />}</button><span><strong>{task.title}</strong><small>{formatTime(task.time)}</small></span></li>)}</ol><div className="tracker-actions">{job.status !== 'completed' && completeTasks === job.tasks.length ? <button className="experience-primary" onClick={onComplete}>Approve completion <CheckCircle2 size={15} /></button> : job.status === 'completed' ? <span className="completion-approved"><BadgeCheck size={16} /> Completion approved</span> : <button className="issue-button" onClick={() => setReporting((current) => !current)}><AlertTriangle size={14} /> Report an issue</button>}</div>{reporting && <form className="issue-form" onSubmit={(event) => { event.preventDefault(); if (issueText.trim()) { onIssue(issueText.trim()); setIssueText(''); setReporting(false); } }}><input autoFocus value={issueText} onChange={(event) => setIssueText(event.target.value)} placeholder="What needs attention?" /><button type="submit" disabled={!issueText.trim()}>Send report</button></form>}</section></div>
        <div className="tracker-note"><ShieldCheck size={15} /> Sample worker profiles. Arrival updates and job status are only simulated in this browser.</div>
    </main>;
}

function WorkerScreen({ jobs, settings, onSettings, onOffer, onSelect }: {
    jobs: JobPlan[];
    settings: WorkerSettings;
    onSettings: (settings: WorkerSettings) => void;
    onOffer: (jobId: string, workerId: string, status: 'accepted' | 'declined') => void;
    onSelect: (job: JobPlan) => void;
}) {
    const worker = sampleWorkers.find((profile) => profile.id === settings.workerId) ?? sampleWorkers[0];
    const matchingOffers = jobs.flatMap((job) => {
        const match = job.matches.find((entry) => entry.workerId === worker.id && entry.status === 'offered');
        const jobDay = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(`${job.date}T12:00:00`));
        const areaMatches = worker.serviceAreas.some((area) => `${job.location} ${job.origin} ${job.destination}`.toLowerCase().includes(area.toLowerCase()))
            || `${job.location} ${job.origin} ${job.destination}`.toLowerCase().includes(settings.serviceArea.toLowerCase());
        const skillsMatch = job.requiredSkills.every((skill) => settings.skills.includes(skill));
        const dateMatches = settings.availableDays.includes(jobDay);
        return match && areaMatches && skillsMatch && dateMatches ? [{ job, match }] : [];
    });
    const acceptedJobs = jobs.flatMap((job) => job.matches.some((match) => match.workerId === worker.id && match.status === 'accepted') ? [job] : []);
    const earnings = jobs.filter((job) => job.status === 'completed' && job.matches.some((match) => match.workerId === worker.id && match.status === 'accepted')).reduce((total, job) => total + job.estimatedHours * settings.hourlyRate, 0);

    function updateSkill(skill: string) {
        const skills = settings.skills.includes(skill) ? settings.skills.filter((entry) => entry !== skill) : [...settings.skills, skill];
        onSettings({ ...settings, skills });
    }

    function updateDay(day: string) {
        const availableDays = settings.availableDays.includes(day) ? settings.availableDays.filter((entry) => entry !== day) : [...settings.availableDays, day];
        onSettings({ ...settings, availableDays });
    }

    return <main className="worker-dashboard"><div className="worker-welcome"><div><span className="proposal-kicker">WORKER WORKROOM <i /> SAMPLE PROFILE</span><h1>Your next good <em>day’s work.</em></h1><p>See relevant offers, check the details, and choose what works for you.</p></div><span className="worker-live-tag"><i /> Profile preview</span></div>
        <section className="worker-summary"><div className="worker-summary-profile"><span className={`worker-profile-large initials-${worker.id}`}>{worker.initials}</span><div><small>WORKER PROFILE</small><strong>{worker.name}</strong><span><BadgeCheck size={13} /> {worker.verified ? 'Verified sample profile' : 'Verification to confirm'}</span></div></div><div className="worker-summary-stat"><span>OFFERS TO REVIEW</span><strong>{String(matchingOffers.length).padStart(2, '0')}</strong></div><div className="worker-summary-stat"><span>ACCEPTED JOBS</span><strong>{String(acceptedJobs.length).padStart(2, '0')}</strong></div><div className="worker-summary-stat"><span>DEMO EARNINGS</span><strong>{formatMoney(earnings)}</strong></div></section>
        <div className="worker-columns">
            <section className="worker-panel offers-panel">
                <div className="worker-panel-heading"><div><span className="proposal-kicker">MATCHED TO YOUR PROFILE</span><h2>Job offers</h2></div><span className="match-count"><UsersRound size={13} /> {matchingOffers.length} to review</span></div>
                <p className="panel-subtitle">Offers are suggested from sample skills and service areas. Real availability and bookings are not connected.</p>
                {matchingOffers.length ? <div className="worker-offers">{matchingOffers.map(({ job, match }) => <article className="worker-offer" key={`${job.id}-${match.status}`}>
                    <div className="offer-topline"><span className={`job-type-icon ${job.category}`}>{job.category === 'farming' ? <Sprout size={16} /> : <Truck size={16} />}</span><span>{categoryName(job.category)} <i /> {formatDate(job.date)}</span><button onClick={() => onSelect(job)} aria-label="View offer details"><ArrowRight size={15} /></button></div>
                    <h3>{job.description}</h3><p><MapPin size={13} /> {job.category === 'moving' ? `${job.origin} → ${job.destination}` : job.location}</p>
                    <div className="offer-facts"><span><Clock3 size={13} /> {formatTime(job.startTime)} · ~{job.estimatedHours} hrs</span><span><WalletCards size={13} /> Est. {formatMoney(job.estimatedHours * settings.hourlyRate)}</span></div>
                    <div className="offer-skills">{job.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                    {match.status === 'offered' && <div className="offer-actions"><button className="offer-decline" onClick={() => onOffer(job.id, worker.id, 'declined')}>Decline</button><button className="experience-primary" onClick={() => onOffer(job.id, worker.id, 'accepted')}>Accept offer <Check size={14} /></button></div>}
                </article>)}</div> : <div className="worker-empty"><span><Search size={19} /></span><strong>No matching offers right now.</strong><small>Review your skills and service area to broaden your matches.</small></div>}
            </section>
            <aside className="worker-panel worker-profile-panel"><div className="worker-panel-heading"><div><span className="proposal-kicker">YOUR DETAILS</span><h2>Worker profile</h2></div><span className="profile-edit-icon"><Wrench size={15} /></span></div><label className="experience-field"><span>Preview profile</span><select value={settings.workerId} onChange={(event) => { const next = sampleWorkers.find((profile) => profile.id === event.target.value); if (next) onSettings({ ...settings, workerId: next.id, skills: next.skills, hourlyRate: next.hourlyRate, serviceArea: next.serviceAreas[0] }); }}><option value={worker.id}>{worker.name}</option>{sampleWorkers.filter((profile) => profile.id !== worker.id).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label className="experience-field"><span>Service area</span><span className="experience-input-icon"><MapPin size={14} /><input value={settings.serviceArea} onChange={(event) => onSettings({ ...settings, serviceArea: event.target.value })} /></span></label><label className="experience-field"><span>Expected hourly rate</span><span className="experience-input-icon"><WalletCards size={14} /><input type="number" min="1" value={settings.hourlyRate} onChange={(event) => onSettings({ ...settings, hourlyRate: Number(event.target.value) })} /><small>USD / hr</small></span></label><fieldset className="worker-profile-fieldset"><legend>Skills</legend><div>{skillOptions.map((skill) => <label key={skill} className={settings.skills.includes(skill) ? 'checked' : ''}><input type="checkbox" checked={settings.skills.includes(skill)} onChange={() => updateSkill(skill)} /><span><Check size={10} /></span>{skill}</label>)}</div></fieldset><fieldset className="worker-profile-fieldset"><legend>Available days</legend><div>{dayOptions.map((day) => <label key={day} className={settings.availableDays.includes(day) ? 'checked' : ''}><input type="checkbox" checked={settings.availableDays.includes(day)} onChange={() => updateDay(day)} /><span><Check size={10} /></span>{day}</label>)}</div></fieldset></aside></div><div className="worker-demo-note"><ShieldCheck size={15} /> Profile edits and offer responses are stored locally for this demo; no real worker is contacted or paid.</div>
    </main>;
}

function WorkerAssignments({ jobs, workerId, onSelect }: { jobs: JobPlan[]; workerId: string; onSelect: (job: JobPlan) => void }) {
    const assignments = jobs.filter((job) => job.matches.some((match) => match.workerId === workerId && match.status === 'accepted'));
    return <div className="worker-history-wrap"><section className="worker-panel assignments-panel">
        <div className="worker-panel-heading"><div><span className="proposal-kicker">YOUR WORK</span><h2>Accepted offers &amp; history</h2></div><span className="match-count">{assignments.length} jobs</span></div>
        {assignments.length ? assignments.map((job) => <button className="assignment-row" key={job.id} onClick={() => onSelect(job)}>
            <span className={`job-type-icon ${job.category}`}>{job.category === 'farming' ? <Sprout size={16} /> : <Truck size={16} />}</span>
            <span><strong>{job.description}</strong><small>{formatDate(job.date)} · {categoryName(job.category)} · ~{job.estimatedHours} hrs</small></span>
            <span className={`job-status-pill status-${job.status}`}>{statusText(job.status)}</span>
            <ArrowRight size={14} />
        </button>) : <p className="assignment-empty">Accepted work will appear here.</p>}
    </section></div>;
}

function AdminScreen({ jobs, verification, onVerify, onSelect, onResolve }: {
    jobs: JobPlan[];
    verification: Record<string, boolean>;
    onVerify: (workerId: string) => void;
    onSelect: (job: JobPlan) => void;
    onResolve: (jobId: string) => void;
}) {
    const attentionJobs = jobs.filter((job) => job.status === 'needs-attention');
    const confirmedJobs = jobs.filter((job) => job.status === 'confirmed' || job.status === 'in-progress');
    const verifiedCount = Object.values(verification).filter(Boolean).length;
    return <main className="admin-dashboard">
        <div className="worker-welcome"><div><span className="proposal-kicker">OPERATIONS WORKROOM <i /> ADMIN PREVIEW</span><h1>Keep coordination <em>accountable.</em></h1><p>Review sample workers, open jobs, and reported issues in one place.</p></div><span className="worker-live-tag"><i /> Demo data only</span></div>
        <section className="admin-metrics"><div><UsersRound size={17} /><span><small>WORKER PROFILES</small><strong>{sampleWorkers.length}</strong></span></div><div><BadgeCheck size={17} /><span><small>VERIFIED SAMPLE</small><strong>{verifiedCount}</strong></span></div><div><MoveRight size={17} /><span><small>CONFIRMED / ACTIVE</small><strong>{confirmedJobs.length}</strong></span></div><div><AlertTriangle size={17} /><span><small>NEEDS ATTENTION</small><strong>{attentionJobs.length}</strong></span></div></section>
        <div className="admin-columns"><section className="worker-panel admin-job-panel"><div className="worker-panel-heading"><div><span className="proposal-kicker">JOB OVERSIGHT</span><h2>Current work</h2></div><span className="match-count">{jobs.length} requests</span></div><div className="admin-job-list">{jobs.map((job) => <div className="admin-job-row" key={job.id}><span className={`job-type-icon ${job.category}`}>{job.category === 'farming' ? <Sprout size={17} /> : <Truck size={17} />}</span><span className="admin-job-copy"><small>{categoryName(job.category)} <i /> {formatDate(job.date)}</small><strong>{job.description}</strong><span>{job.matches.filter((match) => match.status === 'accepted').length} accepted · {job.teamSize} requested</span></span><span className={`job-status-pill status-${job.status}`}>{statusText(job.status)}</span><button aria-label="Review job" onClick={() => onSelect(job)}><ArrowRight size={14} /></button></div>)}</div></section>
            <aside className="admin-side-column"><section className="worker-panel admin-worker-panel"><div className="worker-panel-heading"><div><span className="proposal-kicker">PROFILE REVIEW</span><h2>Worker verification</h2></div><ShieldCheck size={16} /></div><p className="panel-subtitle">Toggle verification for sample profiles. Real identity checks are not connected.</p>{sampleWorkers.map((worker) => <div className="admin-worker-row" key={worker.id}><span className={`worker-initials initials-${worker.id}`}>{worker.initials}</span><span><strong>{worker.name}</strong><small>{worker.skills[0]}</small></span><button className={verification[worker.id] ? 'is-verified' : ''} onClick={() => onVerify(worker.id)}>{verification[worker.id] ? <><BadgeCheck size={12} /> Verified</> : 'Review'}</button></div>)}</section>
                <section className="worker-panel admin-issues-panel"><div className="worker-panel-heading"><div><span className="proposal-kicker">REPORTED ISSUES</span><h2>Needs a response</h2></div><span className="tracker-count">{attentionJobs.length}</span></div>{attentionJobs.length ? attentionJobs.map((job) => <div className="admin-issue-row" key={job.id}><AlertTriangle size={15} /><div><strong>{job.description}</strong><small>{job.issue}</small></div><button onClick={() => onResolve(job.id)}>Resolve</button></div>) : <p className="admin-no-issues"><CheckCircle2 size={15} /> No open sample issues.</p>}</section></aside></div>
        <div className="worker-demo-note"><ShieldCheck size={15} /> Admin actions affect only local sample records. No personal information or identity documents are stored.</div>
    </main>;
}

export default function ManyHandsApp() {
    const [mode, setMode] = useState<'customer' | 'worker' | 'admin'>('customer');
    const [page, setPage] = useState<CustomerStep>('home');
    const [jobs, setJobs] = useState<JobPlan[]>(readJobs);
    const [request, setRequest] = useState<JobRequest | null>(null);
    const [draftPlan, setDraftPlan] = useState<JobPlan | null>(null);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [workerSettings, setWorkerSettings] = useState<WorkerSettings>(readWorkerSettings);
    const [verification, setVerification] = useState<Record<string, boolean>>(() => Object.fromEntries(sampleWorkers.map((worker) => [worker.id, worker.verified])));

    useEffect(() => localStorage.setItem('manyhands-v2-jobs', JSON.stringify(jobs)), [jobs]);
    useEffect(() => localStorage.setItem('manyhands-v2-worker', JSON.stringify(workerSettings)), [workerSettings]);

    const activeJob = jobs.find((job) => job.id === activeJobId) ?? null;

    function startRequest(description: string, category: JobCategory) {
        setRequest(emptyRequest(category, description));
        setDraftPlan(null);
        setMode('customer');
        setPage('clarify');
    }

    function startQuick(description: string, category: JobCategory) {
        startRequest(description, category);
    }

    function updateRequest(key: keyof JobRequest, value: JobRequest[keyof JobRequest]) {
        setRequest((current) => current ? { ...current, [key]: value } : current);
    }

    function createProposal() {
        if (!request || requiredClarifications(request).length > 0) return;
        setDraftPlan(createJobPlan(request));
        setPage('proposal');
    }

    function savePlan() {
        if (!draftPlan) return;
        setJobs((current) => [draftPlan, ...current]);
        setActiveJobId(draftPlan.id);
        setPage('tracker');
    }

    function updateJob(jobId: string, transform: (job: JobPlan) => JobPlan) {
        setJobs((current) => current.map((job) => job.id === jobId ? transform(job) : job));
    }

    function respondToOffer(jobId: string, workerId: string, status: 'accepted' | 'declined') {
        updateJob(jobId, (job) => {
            const matches = job.matches.map((match) => match.workerId === workerId ? { ...match, status } : match);
            const acceptedCount = matches.filter((match) => match.status === 'accepted').length;
            return { ...job, matches, status: acceptedCount >= job.teamSize ? 'confirmed' : 'matching' };
        });
    }

    function advanceTask(jobId: string, taskId: string) {
        updateJob(jobId, (job) => {
            const tasks = job.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task);
            const done = tasks.filter((task) => task.done).length;
            return { ...job, tasks, status: done === tasks.length ? job.status : 'in-progress' };
        });
    }

    function markArrival(jobId: string, workerId: string, arrival: WorkerArrivalStatus) {
        updateJob(jobId, (job) => ({ ...job, matches: job.matches.map((match) => match.workerId === workerId ? { ...match, arrival } : match) }));
    }

    function reportIssue(jobId: string, issue: string) {
        updateJob(jobId, (job) => {
            if (issue) return { ...job, issue, status: 'needs-attention' };
            const acceptedCount = job.matches.filter((match) => match.status === 'accepted').length;
            const doneCount = job.tasks.filter((task) => task.done).length;
            const status: JobStatus = doneCount > 0 ? 'in-progress' : acceptedCount >= job.teamSize ? 'confirmed' : 'matching';
            return { ...job, issue: '', status };
        });
    }

    function selectJob(job: JobPlan) {
        setActiveJobId(job.id);
        setMode('customer');
        setPage('tracker');
    }

    function updateWorkerSettings(settings: WorkerSettings) {
        setWorkerSettings(settings);
    }

    function toggleVerification(workerId: string) {
        setVerification((current) => ({ ...current, [workerId]: !current[workerId] }));
    }

    function resolveIssue(jobId: string) {
        updateJob(jobId, (job) => ({ ...job, issue: '', status: 'in-progress' }));
    }

    const headerPage: CustomerStep = page === 'jobs' || page === 'tracker' ? page : 'home';
    return <div className="manyhands-experience">
        <AppHeader mode={mode} onModeChange={setMode} page={headerPage} onPageChange={setPage} />
        {mode === 'worker' ? <>
            <WorkerScreen jobs={jobs} settings={workerSettings} onSettings={updateWorkerSettings} onOffer={respondToOffer} onSelect={selectJob} />
            <WorkerAssignments jobs={jobs} workerId={workerSettings.workerId} onSelect={selectJob} />
        </> : mode === 'admin' ? <AdminScreen jobs={jobs} verification={verification} onVerify={toggleVerification} onSelect={selectJob} onResolve={resolveIssue} /> : page === 'home' ? <HomeScreen onStart={startRequest} onQuickStart={startQuick} /> : page === 'clarify' && request ? <ClarifyScreen request={request} onChange={updateRequest} onBack={() => setPage('home')} onBuild={createProposal} /> : page === 'proposal' && draftPlan ? <ProposalScreen plan={draftPlan} onBack={() => setPage('clarify')} onSave={savePlan} /> : page === 'jobs' ? <JobsScreen jobs={jobs} onSelect={selectJob} onStart={() => startRequest('', 'moving')} /> : page === 'tracker' && activeJob ? <TrackerScreen job={activeJob} onBack={() => setPage('jobs')} onTaskToggle={(taskId) => advanceTask(activeJob.id, taskId)} onArrival={(workerId, arrival) => markArrival(activeJob.id, workerId, arrival)} onIssue={(issue) => reportIssue(activeJob.id, issue)} onComplete={() => updateJob(activeJob.id, (job) => ({ ...job, status: 'completed' }))} /> : <HomeScreen onStart={startRequest} onQuickStart={startQuick} />}
        <footer className="experience-footer"><span>ManyHands AI <i /> Plan the work. Find the right team. Finish well.</span><span>LOCAL PROTOTYPE · SAMPLE DATA</span></footer>
    </div>;
}