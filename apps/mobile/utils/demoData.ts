import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useCircleStore } from '../stores/circleStore';
import { useHelpBoardStore } from '../stores/helpBoardStore';

// ─── Demo User ─────────────────────────────────────────────────────
export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@careo.app',
  firstName: 'Sarah',
  lastName: 'Johnson',
  subscriptionTier: 'PLUS' as const,
  avatarUrl: undefined,
  phone: '(555) 123-4567',
  timezone: 'America/New_York',
};

// ─── Demo Circle ───────────────────────────────────────────────────
export const DEMO_CIRCLE = {
  id: 'demo-circle-001',
  name: "Mom's Care Circle",
  careRecipient: 'Margaret Johnson',
  memberCount: 3,
  myRole: 'ADMIN' as const,
};

// ─── Demo Medications ──────────────────────────────────────────────
export const DEMO_MEDICATIONS = [
  {
    id: 'demo-med-001',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'DAILY',
    notes: 'Take with food',
    schedules: [
      { label: 'Morning', time: '08:00' },
      { label: 'Evening', time: '20:00' },
    ],
    logs: [],
  },
  {
    id: 'demo-med-002',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'DAILY',
    notes: 'Take after meals',
    schedules: [
      { label: 'Lunch', time: '12:00' },
    ],
    logs: [],
  },
  {
    id: 'demo-med-003',
    name: 'Vitamin D',
    dosage: '2000 IU',
    frequency: 'DAILY',
    notes: '',
    schedules: [
      { label: 'Morning', time: '09:00' },
    ],
    logs: [],
  },
];

// ─── Demo Tasks ────────────────────────────────────────────────────
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 5);

export const DEMO_TASKS = [
  {
    id: 'demo-task-001',
    title: 'Pick up prescription from CVS',
    description: 'Lisinopril refill is ready',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: today.toISOString(),
    assignedTo: { id: 'demo-user-001', firstName: 'Sarah' },
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'demo-task-002',
    title: 'Schedule eye doctor appointment',
    description: 'Annual checkup overdue',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: tomorrow.toISOString(),
    assignedTo: null,
    createdAt: new Date(today.getTime() - 172800000).toISOString(),
  },
  {
    id: 'demo-task-003',
    title: 'Organize pill organizer for the week',
    description: 'Fill Sunday through Saturday slots',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: today.toISOString(),
    assignedTo: { id: 'demo-user-001', firstName: 'Sarah' },
    createdAt: new Date(today.getTime() - 43200000).toISOString(),
  },
  {
    id: 'demo-task-004',
    title: 'Grocery shopping - soft foods',
    description: 'Yogurt, soup, applesauce, pudding',
    status: 'PENDING',
    priority: 'LOW',
    dueDate: nextWeek.toISOString(),
    assignedTo: { id: 'demo-member-002', firstName: 'Mike' },
    createdAt: today.toISOString(),
  },
];

// ─── Demo Appointments ─────────────────────────────────────────────
const apptDate1 = new Date(today);
apptDate1.setDate(apptDate1.getDate() + 2);
apptDate1.setHours(10, 30, 0, 0);

const apptDate2 = new Date(today);
apptDate2.setDate(apptDate2.getDate() + 7);
apptDate2.setHours(14, 0, 0, 0);

const apptDate3 = new Date(today);
apptDate3.setDate(apptDate3.getDate() + 14);
apptDate3.setHours(9, 0, 0, 0);

export const DEMO_APPOINTMENTS = [
  {
    id: 'demo-appt-001',
    title: 'Cardiology Follow-up',
    doctor: 'Dr. Patel',
    location: 'Heart Care Center, Suite 200',
    date: apptDate1.toISOString(),
    time: '10:30',
    status: 'UPCOMING',
    notes: 'Bring latest blood pressure readings',
  },
  {
    id: 'demo-appt-002',
    title: 'Physical Therapy',
    doctor: 'Lisa Chen, PT',
    location: 'RehabWorks Clinic',
    date: apptDate2.toISOString(),
    time: '14:00',
    status: 'UPCOMING',
    notes: 'Knee strengthening exercises',
  },
  {
    id: 'demo-appt-003',
    title: 'Lab Work - Blood Panel',
    doctor: 'Quest Diagnostics',
    location: '45 Main St',
    date: apptDate3.toISOString(),
    time: '09:00',
    status: 'UPCOMING',
    notes: 'Fasting required - no food after midnight',
  },
];

// ─── Demo Activity Feed ────────────────────────────────────────────
export const DEMO_ACTIVITY = [
  {
    id: 'demo-act-001',
    type: 'med_taken',
    title: 'logged Lisinopril 10mg (Morning)',
    userId: 'demo-user-001',
    userName: 'Sarah Johnson',
    timestamp: new Date(today.getTime() - 3600000).toISOString(),
  },
  {
    id: 'demo-act-002',
    type: 'task_completed',
    title: 'completed "Call insurance about claim"',
    userId: 'demo-member-002',
    userName: 'Mike Johnson',
    timestamp: new Date(today.getTime() - 7200000).toISOString(),
  },
  {
    id: 'demo-act-003',
    type: 'journal_added',
    title: 'added a journal entry',
    userId: 'demo-user-001',
    userName: 'Sarah Johnson',
    timestamp: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'demo-act-004',
    type: 'member_joined',
    title: 'joined the care circle',
    userId: 'demo-member-003',
    userName: 'Emily Johnson',
    timestamp: new Date(today.getTime() - 172800000).toISOString(),
  },
];

// ─── Demo Journal Entries ──────────────────────────────────────────
export const DEMO_JOURNAL = [
  {
    id: 'demo-journal-001',
    title: 'Good appetite today',
    body: 'Mom ate a full breakfast and lunch. She seemed more energetic than usual.',
    mood: 'good',
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
    createdBy: { id: 'demo-user-001', firstName: 'Sarah' },
  },
  {
    id: 'demo-journal-002',
    title: 'Walked to the mailbox',
    body: 'First time in two weeks she wanted to walk outside. Physical therapy is helping.',
    mood: 'great',
    createdAt: new Date(today.getTime() - 259200000).toISOString(),
    createdBy: { id: 'demo-user-001', firstName: 'Sarah' },
  },
];

// ─── Demo Help Requests ────────────────────────────────────────────
export const DEMO_HELP_REQUESTS = [
  {
    id: 'demo-help-001',
    category: 'transport' as const,
    title: 'Ride to cardiology appointment',
    description: 'Need someone to drive Mom to Dr. Patel on Thursday at 10am',
    urgency: 'this_week' as const,
    status: 'open' as const,
    createdBy: 'Sarah',
    createdAt: today.toISOString(),
  },
  {
    id: 'demo-help-002',
    category: 'meals' as const,
    title: 'Prepare meals for the weekend',
    description: 'I will be out of town - need someone to make lunch & dinner Sat/Sun',
    urgency: 'this_week' as const,
    status: 'claimed' as const,
    createdBy: 'Sarah',
    createdAt: new Date(today.getTime() - 86400000).toISOString(),
    claimedBy: 'Emily',
    claimedAt: new Date(today.getTime() - 43200000).toISOString(),
  },
];

// ─── Check if demo mode ────────────────────────────────────────────
export function isDemoMode(): boolean {
  const { user } = useAuthStore.getState();
  return user?.id === 'demo-user-001';
}

// ─── Start Demo ────────────────────────────────────────────────────
export async function startDemo(): Promise<void> {
  const authStore = useAuthStore.getState();
  const onboardingStore = useOnboardingStore.getState();
  const circleStore = useCircleStore.getState();
  const helpBoardStore = useHelpBoardStore.getState();

  // Set demo user (no API call)
  await authStore.setAuth(DEMO_USER, 'demo-access-token', 'demo-refresh-token');

  // Set onboarding as complete
  await onboardingStore.setHasSeenOnboarding(true);
  await onboardingStore.setHasSeenPaywall(true);
  await onboardingStore.setCaringFor('Mom');

  // Set up care circle
  circleStore.setCircles([DEMO_CIRCLE]);

  // Set up help board
  for (const req of DEMO_HELP_REQUESTS) {
    helpBoardStore.addRequest(req);
  }
}
