# ManyHands AI

One request. A coordinated team. A completed task.

ManyHands AI is a human-help coordination prototype. Customers describe a real-world task; the app clarifies the details that change the plan, estimates a team and cost range, suggests skill-matched sample workers, and tracks confirmations and completion.

## Run locally

```sh
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. `npm run build` runs strict TypeScript checks and creates the production bundle.

## Included flows

- Customer: request home, conversational clarification, plan and team proposal, job list, worker responses, arrival status, issue reporting, and completion approval.
- Worker: editable sample skills, service area, hourly rate, available weekdays, relevant offers, accept/decline, assignments, and demo earnings.
- Admin: sample worker verification toggles, job oversight, and issue resolution.
- Pilot task types: house moving and paddy harvesting.

## Prototype boundaries

The planner returns typed job-plan data using local rules, not a live language model. Worker profiles, skills, rates, availability, matching, and status changes are sample data saved in this browser's local storage. Estimates are indicative, and no one is contacted, booked, identity-verified, paid, or tracked in real life. Admin verification controls are demonstrations only.

The prototype has no Supabase database, authentication, backend functions, payment flow, or real AI credentials. The next production step is to replace local sample storage with protected server-side records, then connect a structured-output model and a real availability/matching service. Never treat model output as authorization to book a worker or alter payment records.