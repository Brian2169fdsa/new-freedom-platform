// Demo seed data for all Firestore collections.
// Uses plain Date objects instead of Firestore Timestamps — conversion
// is handled by the demo store / adapter layer.

import type {
  Goal,
  GoalCategory,
  Milestone,
  Appointment,
  AppointmentType,
  JobApplication,
  JobApplicationStatus,
  UserDocument,
  DocumentCategory,
  Conversation,
  Message,
  AppNotification,
  NotificationType,
  Budget,
  BudgetItem,
  JournalEntry,
  MoodLevel,
  Achievement,
  AchievementType,
  UserProgress,
  Post,
  PostType,
  Resource,
  ResourceType,
} from '../types/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEMO_USER = 'demo-user';
const CASE_MANAGER_ID = 'cm-johnson-01';
const MENTOR_ID = 'mentor-davis-01';

const now = new Date();

/** Return a new Date shifted by the given number of days (negative = past). */
function daysFromNow(days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}

/** Return a new Date shifted by the given number of hours. */
function hoursFromNow(hours: number): Date {
  const d = new Date(now);
  d.setHours(d.getHours() + hours);
  return d;
}

/** Return a Date for a specific time today (or offset days). */
function atTime(dayOffset: number, hour: number, minute = 0): Date {
  const d = daysFromNow(dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Sobriety start date — 47 days ago. */
const sobrietyStart = daysFromNow(-47);

/** Program enrollment date — 45 days ago (entered program two days after sobriety date). */
const enrollmentDate = daysFromNow(-45);

// ---------------------------------------------------------------------------
// 1. Goals
// ---------------------------------------------------------------------------

const goals: Record<string, any> = {
  'goal-1': {
    id: 'goal-1',
    userId: DEMO_USER,
    title: 'Maintain Sobriety',
    category: 'sobriety' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(318), // ~ 1 year from sobriety start
    progress: 100,
    milestones: [
      { id: 'ms-1a', title: '24 hours sober', completed: true, completedAt: daysFromNow(-46) },
      { id: 'ms-1b', title: '1 week sober', completed: true, completedAt: daysFromNow(-40) },
      { id: 'ms-1c', title: '30 days sober', completed: true, completedAt: daysFromNow(-17) },
      { id: 'ms-1d', title: '60 days sober', completed: false },
      { id: 'ms-1e', title: '90 days sober', completed: false },
    ] as Milestone[],
    createdAt: sobrietyStart,
    updatedAt: daysFromNow(-1),
  } as any,

  'goal-2': {
    id: 'goal-2',
    userId: DEMO_USER,
    title: 'Find Stable Employment',
    category: 'employment' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(45),
    progress: 40,
    milestones: [
      { id: 'ms-2a', title: 'Update resume', completed: true, completedAt: daysFromNow(-30) },
      { id: 'ms-2b', title: 'Complete job-readiness workshop', completed: true, completedAt: daysFromNow(-21) },
      { id: 'ms-2c', title: 'Apply to 10 positions', completed: false },
      { id: 'ms-2d', title: 'Get at least 2 interviews', completed: false },
      { id: 'ms-2e', title: 'Accept a job offer', completed: false },
    ] as Milestone[],
    createdAt: daysFromNow(-35),
    updatedAt: daysFromNow(-2),
  } as any,

  'goal-3': {
    id: 'goal-3',
    userId: DEMO_USER,
    title: 'Secure Transitional Housing',
    category: 'housing' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(30),
    progress: 60,
    milestones: [
      { id: 'ms-3a', title: 'Research housing programs', completed: true, completedAt: daysFromNow(-28) },
      { id: 'ms-3b', title: 'Submit housing applications', completed: true, completedAt: daysFromNow(-18) },
      { id: 'ms-3c', title: 'Tour available units', completed: true, completedAt: daysFromNow(-7) },
      { id: 'ms-3d', title: 'Get approved for transitional housing', completed: false },
      { id: 'ms-3e', title: 'Move in and set up living space', completed: false },
    ] as Milestone[],
    createdAt: daysFromNow(-30),
    updatedAt: daysFromNow(-3),
  } as any,

  'goal-4': {
    id: 'goal-4',
    userId: DEMO_USER,
    title: 'Complete GED Program',
    category: 'education' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(120),
    progress: 25,
    milestones: [
      { id: 'ms-4a', title: 'Enroll in GED prep course', completed: true, completedAt: daysFromNow(-20) },
      { id: 'ms-4b', title: 'Complete math module', completed: false },
      { id: 'ms-4c', title: 'Complete reading & writing module', completed: false },
      { id: 'ms-4d', title: 'Pass practice exam', completed: false },
    ] as Milestone[],
    createdAt: daysFromNow(-22),
    updatedAt: daysFromNow(-5),
  } as any,

  'goal-5': {
    id: 'goal-5',
    userId: DEMO_USER,
    title: 'Build Emergency Savings ($500)',
    category: 'financial' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(90),
    progress: 30,
    milestones: [
      { id: 'ms-5a', title: 'Open a savings account', completed: true, completedAt: daysFromNow(-25) },
      { id: 'ms-5b', title: 'Save first $100', completed: true, completedAt: daysFromNow(-10) },
      { id: 'ms-5c', title: 'Save $250', completed: false },
      { id: 'ms-5d', title: 'Reach $500 goal', completed: false },
    ] as Milestone[],
    createdAt: daysFromNow(-26),
    updatedAt: daysFromNow(-4),
  } as any,

  'goal-6': {
    id: 'goal-6',
    userId: DEMO_USER,
    title: 'Resolve Outstanding Legal Obligations',
    category: 'legal' as GoalCategory,
    status: 'active',
    targetDate: daysFromNow(60),
    progress: 50,
    milestones: [
      { id: 'ms-6a', title: 'Meet with public defender', completed: true, completedAt: daysFromNow(-38) },
      { id: 'ms-6b', title: 'Set up restitution payment plan', completed: true, completedAt: daysFromNow(-25) },
      { id: 'ms-6c', title: 'Complete community service hours', completed: false },
      { id: 'ms-6d', title: 'Attend all scheduled court dates', completed: false },
    ] as Milestone[],
    createdAt: daysFromNow(-40),
    updatedAt: daysFromNow(-6),
  } as any,
};

// ---------------------------------------------------------------------------
// 2. Appointments
// ---------------------------------------------------------------------------

const appointments: Record<string, any> = {
  'appt-1': {
    id: 'appt-1',
    userId: DEMO_USER,
    type: 'case_manager' as AppointmentType,
    title: 'Weekly Check-in with Ms. Johnson',
    dateTime: atTime(1, 10, 0),
    duration: 60,
    location: 'New Freedom Center — Room 204',
    reminders: [atTime(1, 9, 0)],
    status: 'scheduled',
  } as any,

  'appt-2': {
    id: 'appt-2',
    userId: DEMO_USER,
    type: 'therapy' as AppointmentType,
    title: 'Individual Therapy — Dr. Ramirez',
    dateTime: atTime(2, 14, 30),
    duration: 50,
    location: 'Behavioral Health Clinic, Suite 310',
    virtualLink: 'https://telehealth.example.com/session/abc123',
    reminders: [atTime(2, 13, 30)],
    status: 'scheduled',
  } as any,

  'appt-3': {
    id: 'appt-3',
    userId: DEMO_USER,
    type: 'parole' as AppointmentType,
    title: 'Monthly Parole Officer Meeting',
    dateTime: atTime(5, 9, 0),
    duration: 30,
    location: 'County Probation Office — 3rd Floor',
    reminders: [atTime(4, 18, 0)],
    status: 'scheduled',
  } as any,

  'appt-4': {
    id: 'appt-4',
    userId: DEMO_USER,
    type: 'aa_meeting' as AppointmentType,
    title: 'Tuesday Night AA Meeting',
    dateTime: atTime(3, 19, 0),
    duration: 90,
    location: 'Grace Community Church — Basement Hall',
    reminders: [atTime(3, 17, 30)],
    status: 'scheduled',
  } as any,

  'appt-5': {
    id: 'appt-5',
    userId: DEMO_USER,
    type: 'interview' as AppointmentType,
    title: 'Job Interview — Goodwill Industries',
    dateTime: atTime(6, 11, 0),
    duration: 45,
    location: 'Goodwill Career Center, 1500 Main St',
    reminders: [atTime(5, 20, 0), atTime(6, 9, 0)],
    status: 'scheduled',
  } as any,
};

// ---------------------------------------------------------------------------
// 3. Job Applications
// ---------------------------------------------------------------------------

const jobApplications: Record<string, any> = {
  'job-1': {
    id: 'job-1',
    userId: DEMO_USER,
    company: 'Goodwill Industries',
    position: 'Warehouse Associate',
    status: 'interviewing' as JobApplicationStatus,
    appliedDate: daysFromNow(-10),
    notes: 'Fair-chance employer. Phone screen went well — in-person interview scheduled next week. Pays $17/hr.',
    fairChanceEmployer: true,
  } as any,

  'job-2': {
    id: 'job-2',
    userId: DEMO_USER,
    company: 'Greyston Bakery',
    position: 'Production Line Worker',
    status: 'applied' as JobApplicationStatus,
    appliedDate: daysFromNow(-7),
    notes: 'Open hiring model — no background check required. Applied through their website. Union position with benefits after 90 days.',
    fairChanceEmployer: true,
  } as any,

  'job-3': {
    id: 'job-3',
    userId: DEMO_USER,
    company: 'Home Depot',
    position: 'Lot Associate',
    status: 'applied' as JobApplicationStatus,
    appliedDate: daysFromNow(-4),
    notes: 'Ban-the-box employer. Early morning shift available (6am–2pm) which works around GED class schedule. Case manager provided reference letter.',
    fairChanceEmployer: true,
  } as any,

  'job-4': {
    id: 'job-4',
    userId: DEMO_USER,
    company: 'City Parks Department',
    position: 'Grounds Maintenance Crew',
    status: 'saved' as JobApplicationStatus,
    notes: 'Seasonal position starting in spring. Need to check if city allows applicants with felony record. Ms. Johnson said she would look into it.',
    fairChanceEmployer: false,
  } as any,
};

// ---------------------------------------------------------------------------
// 4. Documents
// ---------------------------------------------------------------------------

const documents: Record<string, any> = {
  'doc-1': {
    id: 'doc-1',
    userId: DEMO_USER,
    category: 'id' as DocumentCategory,
    fileName: 'state-id-front.jpg',
    fileURL: '/demo/documents/state-id-front.jpg',
    verified: true,
    verifiedBy: CASE_MANAGER_ID,
    uploadedAt: daysFromNow(-40),
  } as any,

  'doc-2': {
    id: 'doc-2',
    userId: DEMO_USER,
    category: 'social_security' as DocumentCategory,
    fileName: 'social-security-card.pdf',
    fileURL: '/demo/documents/social-security-card.pdf',
    verified: true,
    verifiedBy: CASE_MANAGER_ID,
    uploadedAt: daysFromNow(-38),
  } as any,

  'doc-3': {
    id: 'doc-3',
    userId: DEMO_USER,
    category: 'court_papers' as DocumentCategory,
    fileName: 'release-documentation.pdf',
    fileURL: '/demo/documents/release-documentation.pdf',
    verified: true,
    verifiedBy: CASE_MANAGER_ID,
    uploadedAt: daysFromNow(-44),
  } as any,

  'doc-4': {
    id: 'doc-4',
    userId: DEMO_USER,
    category: 'certification' as DocumentCategory,
    fileName: 'forklift-certification.pdf',
    fileURL: '/demo/documents/forklift-certification.pdf',
    verified: false,
    uploadedAt: daysFromNow(-12),
  } as any,
};

// ---------------------------------------------------------------------------
// 5. Conversations
// ---------------------------------------------------------------------------

const conversations: Record<string, any> = {
  'conv-1': {
    id: 'conv-1',
    participants: [DEMO_USER, CASE_MANAGER_ID],
    type: 'direct',
    title: 'Ms. Johnson (Case Manager)',
    lastMessage: 'I sent over the housing referral. Let me know if you have questions!',
    lastMessageAt: hoursFromNow(-3),
    unreadCount: { [DEMO_USER]: 1, [CASE_MANAGER_ID]: 0 },
  } as any,

  'conv-2': {
    id: 'conv-2',
    participants: [DEMO_USER, MENTOR_ID],
    type: 'direct',
    title: 'Marcus D. (Mentor)',
    lastMessage: 'Proud of you for hitting 47 days. Keep showing up.',
    lastMessageAt: hoursFromNow(-18),
    unreadCount: { [DEMO_USER]: 0, [MENTOR_ID]: 0 },
  } as any,

  'conv-3': {
    id: 'conv-3',
    participants: [DEMO_USER, 'peer-thompson-01'],
    type: 'direct',
    title: 'James T.',
    lastMessage: 'See you at the Tuesday meeting?',
    lastMessageAt: daysFromNow(-1),
    unreadCount: { [DEMO_USER]: 0, 'peer-thompson-01': 1 },
  } as any,
};

// ---------------------------------------------------------------------------
// 6. Messages
// ---------------------------------------------------------------------------

const messages: Record<string, any> = {
  // Conversation 1 — Case Manager
  'msg-1': {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: DEMO_USER,
    content: 'Hi Ms. Johnson, I toured the transitional housing on Elm Street yesterday. It felt like a good fit.',
    type: 'text',
    readBy: [DEMO_USER, CASE_MANAGER_ID],
    createdAt: hoursFromNow(-26),
  } as any,

  'msg-2': {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: CASE_MANAGER_ID,
    content: 'That\'s great to hear! Did you get a chance to talk to the housing coordinator about the application timeline?',
    type: 'text',
    readBy: [DEMO_USER, CASE_MANAGER_ID],
    createdAt: hoursFromNow(-25),
  } as any,

  'msg-3': {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: DEMO_USER,
    content: 'Yes — she said they have an opening in 3 weeks. I need to get my income verification letter. Can you help with that?',
    type: 'text',
    readBy: [DEMO_USER, CASE_MANAGER_ID],
    createdAt: hoursFromNow(-24),
  } as any,

  'msg-4': {
    id: 'msg-4',
    conversationId: 'conv-1',
    senderId: CASE_MANAGER_ID,
    content: 'I sent over the housing referral. Let me know if you have questions!',
    type: 'text',
    readBy: [CASE_MANAGER_ID],
    createdAt: hoursFromNow(-3),
  } as any,

  // Conversation 2 — Mentor
  'msg-5': {
    id: 'msg-5',
    conversationId: 'conv-2',
    senderId: DEMO_USER,
    content: 'Feeling a little anxious today. The job interview is coming up and I keep second-guessing myself.',
    type: 'text',
    readBy: [DEMO_USER, MENTOR_ID],
    createdAt: hoursFromNow(-20),
  } as any,

  'msg-6': {
    id: 'msg-6',
    conversationId: 'conv-2',
    senderId: MENTOR_ID,
    content: 'That\'s completely normal. Remember — you\'ve already done hard things. You showed up every single day for 47 days. That takes strength.',
    type: 'text',
    readBy: [DEMO_USER, MENTOR_ID],
    createdAt: hoursFromNow(-19),
  } as any,

  'msg-7': {
    id: 'msg-7',
    conversationId: 'conv-2',
    senderId: MENTOR_ID,
    content: 'Proud of you for hitting 47 days. Keep showing up.',
    type: 'text',
    readBy: [DEMO_USER, MENTOR_ID],
    createdAt: hoursFromNow(-18),
  } as any,

  // Conversation 3 — Peer
  'msg-8': {
    id: 'msg-8',
    conversationId: 'conv-3',
    senderId: 'peer-thompson-01',
    content: 'See you at the Tuesday meeting?',
    type: 'text',
    readBy: ['peer-thompson-01'],
    createdAt: daysFromNow(-1),
  } as any,
};

// ---------------------------------------------------------------------------
// 7. Notifications
// ---------------------------------------------------------------------------

const notifications: Record<string, any> = {
  'notif-1': {
    id: 'notif-1',
    userId: DEMO_USER,
    type: 'appointment_reminder' as NotificationType,
    title: 'Upcoming Appointment',
    body: 'Weekly check-in with Ms. Johnson tomorrow at 10:00 AM.',
    link: '/appointments/appt-1',
    read: false,
    createdAt: hoursFromNow(-2),
  } as any,

  'notif-2': {
    id: 'notif-2',
    userId: DEMO_USER,
    type: 'achievement' as NotificationType,
    title: 'New Achievement Earned!',
    body: 'You earned the "30 Days Strong" badge. Keep up the incredible work!',
    link: '/achievements',
    read: true,
    createdAt: daysFromNow(-17),
  } as any,

  'notif-3': {
    id: 'notif-3',
    userId: DEMO_USER,
    type: 'job_match' as NotificationType,
    title: 'New Fair-Chance Job Match',
    body: 'Home Depot is hiring Lot Associates in your area. They are a fair-chance employer.',
    link: '/jobs/job-3',
    read: true,
    createdAt: daysFromNow(-5),
  } as any,

  'notif-4': {
    id: 'notif-4',
    userId: DEMO_USER,
    type: 'message' as NotificationType,
    title: 'New Message from Ms. Johnson',
    body: 'I sent over the housing referral. Let me know if you have questions!',
    link: '/messages/conv-1',
    read: false,
    createdAt: hoursFromNow(-3),
  } as any,

  'notif-5': {
    id: 'notif-5',
    userId: DEMO_USER,
    type: 'community' as NotificationType,
    title: 'Someone liked your post',
    body: 'Marcus D. and 3 others liked your milestone post.',
    link: '/community/post-6',
    read: false,
    createdAt: hoursFromNow(-8),
  } as any,
};

// ---------------------------------------------------------------------------
// 8. Budget (current month)
// ---------------------------------------------------------------------------

const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const budgets: Record<string, any> = {
  'budget-1': {
    id: 'budget-1',
    userId: DEMO_USER,
    month: currentMonth,
    income: [
      { id: 'inc-1', label: 'Part-time day labor', amount: 640, category: 'employment' },
      { id: 'inc-2', label: 'Reentry stipend', amount: 400, category: 'benefits' },
      { id: 'inc-3', label: 'SNAP benefits', amount: 234, category: 'benefits' },
    ] as BudgetItem[],
    expenses: [
      { id: 'exp-1', label: 'Transitional housing contribution', amount: 350, category: 'housing' },
      { id: 'exp-2', label: 'Phone bill', amount: 45, category: 'utilities' },
      { id: 'exp-3', label: 'Bus pass', amount: 65, category: 'transportation' },
      { id: 'exp-4', label: 'Groceries (after SNAP)', amount: 120, category: 'food' },
      { id: 'exp-5', label: 'Hygiene / personal items', amount: 35, category: 'personal' },
      { id: 'exp-6', label: 'Restitution payment', amount: 100, category: 'legal' },
      { id: 'exp-7', label: 'GED study materials', amount: 25, category: 'education' },
    ] as BudgetItem[],
    savingsGoal: 150,
  } as any,
};

// ---------------------------------------------------------------------------
// 9. Journal Entries
// ---------------------------------------------------------------------------

const journal_entries: Record<string, any> = {
  'journal-1': {
    id: 'journal-1',
    userId: DEMO_USER,
    date: daysFromNow(-3),
    mood: 'good' as MoodLevel,
    moodScore: 4,
    content:
      'Toured the transitional housing unit on Elm Street today. It\'s small but clean — has a kitchenette and a window that gets morning light. The coordinator was kind and didn\'t treat me like a number. I could actually see myself living there. Feeling hopeful for the first time about having my own space.',
    tags: ['housing', 'progress', 'hope'],
    isPrivate: false,
    relatedStep: 3,
  } as any,

  'journal-2': {
    id: 'journal-2',
    userId: DEMO_USER,
    date: daysFromNow(-5),
    mood: 'struggling' as MoodLevel,
    moodScore: 2,
    content:
      'Rough day. Ran into someone from my old life at the grocery store. They asked if I wanted to hang out this weekend and I know what that means. Said no, but my hands were shaking the whole walk home. Called Marcus when I got back and talked it through. He reminded me that the craving is just a feeling and feelings pass. Went to an extra meeting tonight.',
    tags: ['triggers', 'cravings', 'support', 'meetings'],
    isPrivate: true,
    relatedStep: 1,
  } as any,

  'journal-3': {
    id: 'journal-3',
    userId: DEMO_USER,
    date: daysFromNow(-1),
    mood: 'great' as MoodLevel,
    moodScore: 5,
    content:
      'Got the call — Goodwill wants me to come in for an in-person interview! I\'ve been practicing answers with my case manager and I feel prepared. Also hit day 46 of sobriety yesterday. Almost 7 weeks. Never thought I\'d make it this far. Step 3 is resonating with me — learning to let go of things I can\'t control and trusting the process.',
    tags: ['employment', 'sobriety', 'step-work', 'gratitude'],
    isPrivate: false,
    relatedStep: 3,
  } as any,

  'journal-4': {
    id: 'journal-4',
    userId: DEMO_USER,
    date: daysFromNow(0),
    mood: 'okay' as MoodLevel,
    moodScore: 3,
    content:
      'Woke up feeling a bit flat this morning. Not bad, just sort of numb. GED math homework is frustrating — fractions still trip me up. But I stayed with it for a full hour today instead of quitting early. Small win. Reminding myself that progress isn\'t always a straight line.',
    tags: ['education', 'perseverance', 'self-compassion'],
    isPrivate: false,
    relatedStep: 3,
  } as any,
};

// ---------------------------------------------------------------------------
// 10. Achievements
// ---------------------------------------------------------------------------

const achievements: Record<string, any> = {
  'ach-1': {
    id: 'ach-1',
    userId: DEMO_USER,
    type: 'sobriety_milestone' as AchievementType,
    title: '30 Days Strong',
    description: 'Maintained sobriety for 30 consecutive days. This is a major milestone — most relapses happen in the first month.',
    icon: 'shield-check',
    rank: 'silver',
    earnedAt: daysFromNow(-17),
    shared: true,
  } as any,

  'ach-2': {
    id: 'ach-2',
    userId: DEMO_USER,
    type: 'step_completion' as AchievementType,
    title: 'Step 1 Complete',
    description: 'Completed Step 1 — Admitted powerlessness. The first step is often the hardest.',
    icon: 'footprints',
    rank: 'bronze',
    earnedAt: daysFromNow(-35),
    shared: false,
  } as any,

  'ach-3': {
    id: 'ach-3',
    userId: DEMO_USER,
    type: 'step_completion' as AchievementType,
    title: 'Step 2 Complete',
    description: 'Completed Step 2 — Came to believe that a power greater than ourselves could restore us to sanity.',
    icon: 'footprints',
    rank: 'bronze',
    earnedAt: daysFromNow(-20),
    shared: false,
  } as any,

  'ach-4': {
    id: 'ach-4',
    userId: DEMO_USER,
    type: 'community' as AchievementType,
    title: 'First Post',
    description: 'Shared your first community post. Your story can inspire others on their journey.',
    icon: 'message-circle',
    rank: 'bronze',
    earnedAt: daysFromNow(-28),
    shared: true,
  } as any,

  'ach-5': {
    id: 'ach-5',
    userId: DEMO_USER,
    type: 'streak' as AchievementType,
    title: '7-Day Check-In Streak',
    description: 'Completed daily check-ins for 7 consecutive days. Consistency builds the foundation for lasting change.',
    icon: 'flame',
    rank: 'silver',
    earnedAt: daysFromNow(-8),
    shared: true,
  } as any,
};

// ---------------------------------------------------------------------------
// 11. User Progress (12-step course modules)
// ---------------------------------------------------------------------------

const user_progress: Record<string, any> = {
  'progress-1': {
    id: 'progress-1',
    userId: DEMO_USER,
    courseId: 'course-step-1',
    moduleId: 'mod-1-intro',
    status: 'completed',
    completedAt: daysFromNow(-37),
    videoProgress: 100,
    reflectionText: 'Admitting I was powerless was terrifying but also freeing. I spent years pretending I had it under control.',
  } as any,

  'progress-2': {
    id: 'progress-2',
    userId: DEMO_USER,
    courseId: 'course-step-1',
    moduleId: 'mod-1-assessment',
    status: 'completed',
    completedAt: daysFromNow(-35),
    assessmentScore: 85,
  } as any,

  'progress-3': {
    id: 'progress-3',
    userId: DEMO_USER,
    courseId: 'course-step-2',
    moduleId: 'mod-2-intro',
    status: 'completed',
    completedAt: daysFromNow(-22),
    videoProgress: 100,
    reflectionText: 'Finding something bigger than myself to believe in. For me right now that\'s this community and the people who show up for me every day.',
  } as any,

  'progress-4': {
    id: 'progress-4',
    userId: DEMO_USER,
    courseId: 'course-step-3',
    moduleId: 'mod-3-intro',
    status: 'in_progress',
    videoProgress: 65,
  } as any,
};

// ---------------------------------------------------------------------------
// 12. Daily Check-ins (last 7 days)
// ---------------------------------------------------------------------------

const daily_checkins: Record<string, any> = {
  'checkin-1': {
    id: 'checkin-1',
    userId: DEMO_USER,
    date: daysFromNow(-6),
    mood: 'good' as MoodLevel,
    moodScore: 4,
    spiScore: 2, // Substance/pain index — low
    didAttendMeeting: true,
    didExercise: true,
    didTakeMediation: false,
    hoursSlept: 7,
    triggers: [],
    gratitude: 'Grateful for my case manager going the extra mile on the housing paperwork.',
    createdAt: daysFromNow(-6),
  },

  'checkin-2': {
    id: 'checkin-2',
    userId: DEMO_USER,
    date: daysFromNow(-5),
    mood: 'struggling' as MoodLevel,
    moodScore: 2,
    spiScore: 6,
    didAttendMeeting: true,
    didExercise: false,
    didTakeMediation: false,
    hoursSlept: 4,
    triggers: ['ran into old acquaintance', 'stress'],
    gratitude: 'Grateful I called Marcus instead of giving in.',
    createdAt: daysFromNow(-5),
  },

  'checkin-3': {
    id: 'checkin-3',
    userId: DEMO_USER,
    date: daysFromNow(-4),
    mood: 'okay' as MoodLevel,
    moodScore: 3,
    spiScore: 3,
    didAttendMeeting: false,
    didExercise: true,
    didTakeMediation: false,
    hoursSlept: 6,
    triggers: [],
    gratitude: 'Made it through a tough day yesterday and woke up sober.',
    createdAt: daysFromNow(-4),
  },

  'checkin-4': {
    id: 'checkin-4',
    userId: DEMO_USER,
    date: daysFromNow(-3),
    mood: 'good' as MoodLevel,
    moodScore: 4,
    spiScore: 1,
    didAttendMeeting: false,
    didExercise: true,
    didTakeMediation: true,
    hoursSlept: 7.5,
    triggers: [],
    gratitude: 'The housing tour went really well. Feeling like things are moving forward.',
    createdAt: daysFromNow(-3),
  },

  'checkin-5': {
    id: 'checkin-5',
    userId: DEMO_USER,
    date: daysFromNow(-2),
    mood: 'good' as MoodLevel,
    moodScore: 4,
    spiScore: 1,
    didAttendMeeting: true,
    didExercise: false,
    didTakeMediation: true,
    hoursSlept: 7,
    triggers: [],
    gratitude: 'The group at the meeting really encouraged me about the job interview.',
    createdAt: daysFromNow(-2),
  },

  'checkin-6': {
    id: 'checkin-6',
    userId: DEMO_USER,
    date: daysFromNow(-1),
    mood: 'great' as MoodLevel,
    moodScore: 5,
    spiScore: 0,
    didAttendMeeting: false,
    didExercise: true,
    didTakeMediation: true,
    hoursSlept: 8,
    triggers: [],
    gratitude: 'Got the interview call from Goodwill. 47 days sober. Life is starting to feel real.',
    createdAt: daysFromNow(-1),
  },

  'checkin-7': {
    id: 'checkin-7',
    userId: DEMO_USER,
    date: daysFromNow(0),
    mood: 'okay' as MoodLevel,
    moodScore: 3,
    spiScore: 2,
    didAttendMeeting: false,
    didExercise: false,
    didTakeMediation: true,
    hoursSlept: 6,
    triggers: ['frustration with GED math'],
    gratitude: 'I stuck with the homework even when I wanted to quit.',
    createdAt: daysFromNow(0),
  },
};

// ---------------------------------------------------------------------------
// 13. Community Posts
// ---------------------------------------------------------------------------

const posts: Record<string, any> = {
  'post-1': {
    id: 'post-1',
    authorId: 'peer-thompson-01',
    type: 'text' as PostType,
    content:
      'Just finished my first week at the warehouse job. My feet are killing me but I don\'t even care. First honest paycheck in four years. We out here.',
    likes: [DEMO_USER, MENTOR_ID, 'peer-williams-01'],
    commentCount: 5,
    isAnonymous: false,
    moderationStatus: 'approved',
    createdAt: daysFromNow(-8),
  } as any,

  'post-2': {
    id: 'post-2',
    authorId: 'peer-williams-01',
    type: 'resource_share' as PostType,
    content:
      'PSA: The community kitchen on 5th Ave is doing free hot meals Tue/Thu from 5–7pm. No ID needed. The food is actually really good — had chicken and rice last night. Spread the word.',
    likes: [DEMO_USER, 'peer-thompson-01', 'peer-garcia-01', MENTOR_ID],
    commentCount: 3,
    isAnonymous: false,
    moderationStatus: 'approved',
    createdAt: daysFromNow(-6),
  } as any,

  'post-3': {
    id: 'post-3',
    authorId: 'anonymous',
    type: 'text' as PostType,
    content:
      'Is it normal to still have cravings after a month? I thought they would be gone by now. Feeling discouraged.',
    likes: [DEMO_USER, MENTOR_ID, 'peer-thompson-01', 'peer-williams-01', 'peer-garcia-01'],
    commentCount: 12,
    isAnonymous: true,
    moderationStatus: 'approved',
    createdAt: daysFromNow(-4),
  } as any,

  'post-4': {
    id: 'post-4',
    authorId: MENTOR_ID,
    type: 'text' as PostType,
    content:
      'To everyone in the early days: It gets easier, but it never gets easy. The difference is you get stronger. Three years ago I was sleeping in my car. Today I mentor four people and just signed a lease on a two-bedroom apartment. Your past doesn\'t define your future.',
    likes: [DEMO_USER, 'peer-thompson-01', 'peer-williams-01', 'peer-garcia-01', 'peer-lee-01', 'peer-brown-01'],
    commentCount: 18,
    isAnonymous: false,
    moderationStatus: 'approved',
    createdAt: daysFromNow(-3),
  } as any,

  'post-5': {
    id: 'post-5',
    authorId: 'peer-garcia-01',
    type: 'milestone' as PostType,
    content:
      '60 DAYS! I can\'t believe it. Two months ago I couldn\'t go two hours. Thank you to everyone in this community who held me up when I couldn\'t hold myself.',
    likes: [DEMO_USER, MENTOR_ID, 'peer-thompson-01', 'peer-williams-01', 'peer-lee-01'],
    commentCount: 9,
    isAnonymous: false,
    moderationStatus: 'approved',
    createdAt: daysFromNow(-2),
  } as any,

  'post-6': {
    id: 'post-6',
    authorId: DEMO_USER,
    type: 'milestone' as PostType,
    content:
      'Day 47. Got a job interview lined up for next week, housing application is moving forward, and I\'m on Step 3. None of this was on my radar two months ago. One day at a time really does add up. Grateful for this community.',
    likes: [MENTOR_ID, 'peer-thompson-01', 'peer-garcia-01', 'peer-williams-01'],
    commentCount: 7,
    isAnonymous: false,
    moderationStatus: 'approved',
    createdAt: hoursFromNow(-10),
  } as any,
};

// ---------------------------------------------------------------------------
// 14. Resources
// ---------------------------------------------------------------------------

const resources: Record<string, any> = {
  'resource-1': {
    id: 'resource-1',
    name: 'Hope House Transitional Living',
    type: 'shelter' as ResourceType,
    address: '420 Elm Street',
    city: 'Springfield',
    phone: '(555) 234-5678',
    website: 'https://hopehouse.example.org',
    hours: 'Office: Mon–Fri 8am–6pm. Residence: 24/7',
    description:
      'Transitional housing program for men and women in recovery. Provides private and semi-private rooms, on-site case management, and life-skills workshops. Residents typically stay 6–12 months.',
    services: ['transitional housing', 'case management', 'life skills training', 'job placement assistance'],
    availability: { beds: { total: 40, available: 3 }, walkIn: false },
    location: { latitude: 39.7817, longitude: -89.6501 },
    communityRating: 4.5,
    lastVerified: daysFromNow(-10),
    verifiedBy: CASE_MANAGER_ID,
  } as any,

  'resource-2': {
    id: 'resource-2',
    name: 'Second Chance Employment Center',
    type: 'employment' as ResourceType,
    address: '1500 Main Street, Suite 200',
    city: 'Springfield',
    phone: '(555) 345-6789',
    website: 'https://secondchancejobs.example.org',
    hours: 'Mon–Fri 9am–5pm, Sat 10am–2pm',
    description:
      'Employment services specifically for justice-involved individuals. Offers resume help, interview coaching, employer connections, and a fair-chance employer database. Walk-ins welcome.',
    services: ['resume writing', 'interview prep', 'job matching', 'fair-chance employer network', 'vocational training referrals'],
    availability: { walkIn: true },
    location: { latitude: 39.7990, longitude: -89.6440 },
    communityRating: 4.8,
    lastVerified: daysFromNow(-5),
    verifiedBy: CASE_MANAGER_ID,
  } as any,

  'resource-3': {
    id: 'resource-3',
    name: 'Community Kitchen at Fifth Avenue Church',
    type: 'food' as ResourceType,
    address: '800 Fifth Avenue',
    city: 'Springfield',
    phone: '(555) 456-7890',
    hours: 'Tue & Thu 5pm–7pm, Sat 11am–1pm',
    description:
      'Free hot meals served in a welcoming environment. No ID or documentation required. Vegetarian options always available. Take-away containers provided.',
    services: ['hot meals', 'take-away meals', 'food pantry bags (Saturdays)'],
    availability: { walkIn: true },
    location: { latitude: 39.7925, longitude: -89.6480 },
    communityRating: 4.7,
    lastVerified: daysFromNow(-7),
    verifiedBy: 'volunteer-coord-01',
  } as any,

  'resource-4': {
    id: 'resource-4',
    name: 'Behavioral Health Associates',
    type: 'mental_health' as ResourceType,
    address: '310 Healthcare Drive, Suite 310',
    city: 'Springfield',
    phone: '(555) 567-8901',
    website: 'https://bha-springfield.example.org',
    hours: 'Mon–Fri 8am–8pm, Sat 9am–1pm',
    description:
      'Outpatient mental health and substance use disorder treatment. Offers individual therapy, group therapy, psychiatric services, and medication-assisted treatment (MAT). Accepts Medicaid and offers sliding-scale fees.',
    services: ['individual therapy', 'group therapy', 'psychiatric evaluation', 'MAT', 'crisis intervention', 'telehealth'],
    availability: { walkIn: false },
    location: { latitude: 39.7860, longitude: -89.6520 },
    communityRating: 4.3,
    lastVerified: daysFromNow(-14),
    verifiedBy: CASE_MANAGER_ID,
  } as any,

  'resource-5': {
    id: 'resource-5',
    name: 'Springfield Legal Aid Society',
    type: 'legal' as ResourceType,
    address: '220 Court Street',
    city: 'Springfield',
    phone: '(555) 678-9012',
    website: 'https://springfieldlegalaid.example.org',
    hours: 'Mon–Fri 9am–5pm',
    description:
      'Free legal assistance for low-income individuals. Specializes in reentry issues: record expungement, driver\'s license reinstatement, child support modifications, housing discrimination, and employment rights.',
    services: ['record expungement', 'legal consultations', 'court representation', 'rights education', 'driver license reinstatement'],
    availability: { walkIn: false },
    location: { latitude: 39.8010, longitude: -89.6450 },
    communityRating: 4.6,
    lastVerified: daysFromNow(-21),
    verifiedBy: 'admin-01',
  } as any,
};

// ---------------------------------------------------------------------------
// 15. Courses (Lane 2 — 12-step curriculum)
// ---------------------------------------------------------------------------

const courses: Record<string, any> = {
  'course-step-1': {
    id: 'course-step-1',
    title: 'Step 1: Honesty',
    description: 'We admitted we were powerless over our addiction — that our lives had become unmanageable. This step is about breaking through denial and accepting the reality of addiction.',
    stepNumber: 1,
    order: 1,
    modules: [
      { id: 'mod-1-1', courseId: 'course-step-1', title: 'Introduction to Step 1', type: 'video', content: { videoURL: 'https://demo.reprieve.app/videos/step1-intro' }, duration: 15, order: 1 },
      { id: 'mod-1-2', courseId: 'course-step-1', title: 'Understanding Powerlessness', type: 'reading', content: { text: 'Powerlessness does not mean weakness...' }, duration: 10, order: 2 },
      { id: 'mod-1-3', courseId: 'course-step-1', title: 'Step 1 Assessment', type: 'assessment', content: { surveyJSON: {} }, duration: 20, order: 3 },
    ],
    totalDuration: 45,
    isPublished: true,
  } as any,
  'course-step-2': {
    id: 'course-step-2',
    title: 'Step 2: Hope',
    description: 'Came to believe that a Power greater than ourselves could restore us to sanity. This step plants the seed of hope that change is possible.',
    stepNumber: 2,
    order: 2,
    modules: [
      { id: 'mod-2-1', courseId: 'course-step-2', title: 'Introduction to Step 2', type: 'video', content: { videoURL: 'https://demo.reprieve.app/videos/step2-intro' }, duration: 12, order: 1 },
      { id: 'mod-2-2', courseId: 'course-step-2', title: 'Finding Your Higher Power', type: 'reading', content: { text: 'A higher power can be anything greater than yourself...' }, duration: 15, order: 2 },
      { id: 'mod-2-3', courseId: 'course-step-2', title: 'Step 2 Reflection', type: 'reflection', content: {}, duration: 20, order: 3 },
    ],
    totalDuration: 47,
    isPublished: true,
  } as any,
  'course-step-3': {
    id: 'course-step-3',
    title: 'Step 3: Faith',
    description: 'Made a decision to turn our will and our lives over to the care of God as we understood Him. This step is about surrender and trust.',
    stepNumber: 3,
    order: 3,
    modules: [
      { id: 'mod-3-1', courseId: 'course-step-3', title: 'Introduction to Step 3', type: 'video', content: { videoURL: 'https://demo.reprieve.app/videos/step3-intro' }, duration: 14, order: 1 },
      { id: 'mod-3-2', courseId: 'course-step-3', title: 'Letting Go of Control', type: 'reading', content: { text: 'Control is an illusion that keeps us trapped...' }, duration: 12, order: 2 },
    ],
    totalDuration: 26,
    isPublished: true,
  } as any,
  'course-step-4': {
    id: 'course-step-4',
    title: 'Step 4: Courage',
    description: 'Made a searching and fearless moral inventory of ourselves.',
    stepNumber: 4,
    order: 4,
    modules: [
      { id: 'mod-4-1', courseId: 'course-step-4', title: 'Introduction to Step 4', type: 'video', content: { videoURL: 'https://demo.reprieve.app/videos/step4-intro' }, duration: 16, order: 1 },
    ],
    totalDuration: 16,
    isPublished: true,
  } as any,
};

// Steps 5-12 (abbreviated — published but not started)
for (let i = 5; i <= 12; i++) {
  const titles: Record<number, string> = {
    5: 'Integrity', 6: 'Willingness', 7: 'Humility', 8: 'Brotherly Love',
    9: 'Justice', 10: 'Perseverance', 11: 'Spiritual Awareness', 12: 'Service',
  };
  courses[`course-step-${i}`] = {
    id: `course-step-${i}`,
    title: `Step ${i}: ${titles[i]}`,
    description: `Step ${i} of the 12-step journey.`,
    stepNumber: i,
    order: i,
    modules: [
      { id: `mod-${i}-1`, courseId: `course-step-${i}`, title: `Introduction to Step ${i}`, type: 'video', content: {}, duration: 15, order: 1 },
    ],
    totalDuration: 15,
    isPublished: true,
  } as any;
}

// ---------------------------------------------------------------------------
// 16. Users (for admin dashboard and cross-referencing)
// ---------------------------------------------------------------------------

const users: Record<string, any> = {
  'demo-user': {
    id: 'demo-user',
    uid: 'demo-user',
    email: 'marcus.johnson@email.com',
    displayName: 'Marcus Johnson',
    role: 'member',
    lanes: ['lane1', 'lane2', 'lane3'],
    createdAt: enrollmentDate,
    updatedAt: now,
    lastLoginAt: now,
    profile: {
      firstName: 'Marcus',
      lastName: 'Johnson',
      preferredLanguage: 'en',
      city: 'Phoenix',
      state: 'AZ',
      sobrietyDate: sobrietyStart,
    },
    reentry: { enrollmentStatus: 'active', caseManagerId: CASE_MANAGER_ID },
    stepExperience: { currentStep: 3 },
    settings: { notifications: { push: true, email: true, sms: false }, privacy: { profileVisible: true, showSobrietyDate: true, shareProgressWithMentor: true } },
  } as any,
  [CASE_MANAGER_ID]: {
    id: CASE_MANAGER_ID,
    uid: CASE_MANAGER_ID,
    email: 'sarah.chen@reprieve.org',
    displayName: 'Sarah Chen',
    role: 'case_manager',
    lanes: ['lane1'],
    createdAt: daysFromNow(-180),
    profile: { firstName: 'Sarah', lastName: 'Chen', preferredLanguage: 'en' },
    settings: { notifications: { push: true, email: true, sms: false }, privacy: { profileVisible: true, showSobrietyDate: false, shareProgressWithMentor: false } },
  } as any,
  [MENTOR_ID]: {
    id: MENTOR_ID,
    uid: MENTOR_ID,
    email: 'james.davis@email.com',
    displayName: 'James Davis',
    role: 'mentor',
    lanes: ['lane2', 'lane3'],
    createdAt: daysFromNow(-365),
    profile: { firstName: 'James', lastName: 'Davis', preferredLanguage: 'en', sobrietyDate: daysFromNow(-730) },
    myStruggle: { isMentor: true },
    settings: { notifications: { push: true, email: true, sms: false }, privacy: { profileVisible: true, showSobrietyDate: true, shareProgressWithMentor: true } },
  } as any,
  'admin-01': {
    id: 'admin-01',
    uid: 'admin-01',
    email: 'admin@reprieve.org',
    displayName: 'Admin User',
    role: 'super_admin',
    lanes: ['lane1', 'lane2', 'lane3'],
    createdAt: daysFromNow(-365),
    profile: { firstName: 'Admin', lastName: 'User', preferredLanguage: 'en' },
    settings: { notifications: { push: true, email: true, sms: false }, privacy: { profileVisible: false, showSobrietyDate: false, shareProgressWithMentor: false } },
  } as any,
  'peer-thompson-01': {
    id: 'peer-thompson-01',
    uid: 'peer-thompson-01',
    email: 'james.t@email.com',
    displayName: 'James Thompson',
    role: 'member',
    lanes: ['lane1', 'lane2', 'lane3'],
    createdAt: daysFromNow(-90),
    profile: { firstName: 'James', lastName: 'Thompson', preferredLanguage: 'en', sobrietyDate: daysFromNow(-120) },
    settings: { notifications: { push: true, email: true, sms: false }, privacy: { profileVisible: true, showSobrietyDate: true, shareProgressWithMentor: true } },
  } as any,
};

// ---------------------------------------------------------------------------
// 17. Community threads & replies (Lane 2)
// ---------------------------------------------------------------------------

const threads: Record<string, any> = {
  'thread-1': {
    id: 'thread-1',
    userId: 'peer-thompson-01',
    stepNumber: 3,
    title: 'Struggling with the concept of a Higher Power',
    content: 'I grew up without any religious background and I am having trouble with Step 3. How did others approach this? I want to be open but it feels forced.',
    likes: ['demo-user'],
    replyCount: 2,
    createdAt: daysFromNow(-3),
  } as any,
  'thread-2': {
    id: 'thread-2',
    userId: MENTOR_ID,
    stepNumber: 1,
    title: 'Reminder: Honesty starts with yourself',
    content: 'When I did Step 1, the hardest part was being honest with myself about how bad things had gotten. I kept minimizing. It was only when I wrote it all down that I saw the full picture. Be brave.',
    likes: ['demo-user', 'peer-thompson-01'],
    replyCount: 1,
    createdAt: daysFromNow(-5),
  } as any,
};

const replies: Record<string, any> = {
  'reply-1': {
    id: 'reply-1',
    threadId: 'thread-1',
    userId: MENTOR_ID,
    content: 'Your Higher Power does not have to be religious at all. Mine is the support group itself — the collective wisdom and compassion of people who understand. Start there.',
    likes: ['demo-user'],
    createdAt: daysFromNow(-2),
  } as any,
  'reply-2': {
    id: 'reply-2',
    threadId: 'thread-1',
    userId: 'demo-user',
    content: 'Thanks James, that actually helps a lot. I have been overthinking it. The group really has been my anchor.',
    likes: [MENTOR_ID],
    createdAt: daysFromNow(-1),
  } as any,
  'reply-3': {
    id: 'reply-3',
    threadId: 'thread-2',
    userId: 'demo-user',
    content: 'This really resonated with me. Writing my first step was eye-opening. Grateful for this community.',
    likes: [],
    createdAt: daysFromNow(-4),
  } as any,
};

// ---------------------------------------------------------------------------
// 18. Support Groups (Lane 3)
// ---------------------------------------------------------------------------

const support_groups: Record<string, any> = {
  'group-1': {
    id: 'group-1',
    name: 'Phoenix Fresh Start',
    description: 'A group for people in the Phoenix metro area rebuilding their lives after incarceration. We meet weekly to share resources, job leads, and encouragement.',
    type: 'public',
    category: 'reentry',
    memberCount: 24,
    members: ['demo-user', MENTOR_ID, 'peer-thompson-01'],
    admins: [MENTOR_ID],
    createdBy: MENTOR_ID,
    createdAt: daysFromNow(-60),
    lastActivity: daysFromNow(-1),
    imageURL: '',
  } as any,
  'group-2': {
    id: 'group-2',
    name: 'Sober Living Support',
    description: 'Private support group for people in sober living facilities. Share challenges, victories, and daily reflections in a safe space.',
    type: 'private',
    category: 'sobriety',
    memberCount: 12,
    members: ['demo-user', 'peer-thompson-01'],
    admins: ['peer-thompson-01'],
    createdBy: 'peer-thompson-01',
    createdAt: daysFromNow(-30),
    lastActivity: daysFromNow(0),
    imageURL: '',
  } as any,
};

// ---------------------------------------------------------------------------
// 19. Events (Lane 3)
// ---------------------------------------------------------------------------

const events: Record<string, any> = {
  'event-1': {
    id: 'event-1',
    title: 'Job Fair — Fair Chance Employers',
    description: 'Over 20 employers committed to fair-chance hiring will be present. Bring your resume! Free professional headshots and interview coaching available.',
    location: 'Phoenix Convention Center, Hall B',
    date: atTime(5, 10, 0),
    endDate: atTime(5, 14, 0),
    organizer: 'Phoenix Re-Entry Alliance',
    attendees: ['demo-user', MENTOR_ID],
    maxAttendees: 200,
    category: 'employment',
    createdAt: daysFromNow(-10),
  } as any,
  'event-2': {
    id: 'event-2',
    title: 'Community Cookout & Fellowship',
    description: 'Join us for food, music, and connection. Families welcome. This is a substance-free event.',
    location: 'Encanto Park Ramada #3',
    date: atTime(8, 11, 0),
    endDate: atTime(8, 15, 0),
    organizer: 'REPrieve Community',
    attendees: ['demo-user', 'peer-thompson-01'],
    maxAttendees: 50,
    category: 'social',
    createdAt: daysFromNow(-5),
  } as any,
  'event-3': {
    id: 'event-3',
    title: 'Know Your Rights Workshop',
    description: 'Free legal workshop covering expungement, housing rights, and employment protections for formerly incarcerated individuals.',
    location: 'Springfield Legal Aid, 220 Court Street',
    date: atTime(12, 18, 0),
    endDate: atTime(12, 20, 0),
    organizer: 'Springfield Legal Aid Society',
    attendees: [],
    maxAttendees: 30,
    category: 'legal',
    createdAt: daysFromNow(-3),
  } as any,
};

// ---------------------------------------------------------------------------
// 20. Resumes (Lane 1 — Resume Builder)
// ---------------------------------------------------------------------------

const resumes: Record<string, any> = {
  'resume-1': {
    id: 'resume-1',
    userId: DEMO_USER,
    title: 'General Resume',
    personalInfo: {
      fullName: 'Marcus Johnson',
      email: 'marcus.johnson@email.com',
      phone: '(555) 123-4567',
      city: 'Phoenix',
      state: 'AZ',
    },
    summary: 'Dedicated and reliable worker with experience in warehouse operations and construction. Currently pursuing GED while rebuilding my career. Strong work ethic, quick learner, and team player.',
    experience: [
      {
        company: 'Day Labor Staffing Solutions',
        position: 'General Laborer',
        startDate: daysFromNow(-30),
        current: true,
        description: 'Warehouse loading/unloading, construction site cleanup, moving assistance. Consistently receive positive feedback from supervisors.',
      },
    ],
    education: [
      {
        institution: 'Maricopa County Adult Education',
        degree: 'GED (In Progress)',
        startDate: daysFromNow(-20),
        current: true,
      },
    ],
    skills: ['Warehouse operations', 'Forklift certified', 'Construction basics', 'Team collaboration', 'Time management', 'Physical labor'],
    certifications: ['Forklift Operator Certification'],
    createdAt: daysFromNow(-15),
    updatedAt: daysFromNow(-2),
  } as any,
};

// ---------------------------------------------------------------------------
// 21. Jobs (Lane 1 — Job Board)
// ---------------------------------------------------------------------------

const jobs: Record<string, any> = {
  'job-001': {
    id: 'job-001',
    title: 'Warehouse Associate',
    company: 'Desert Distribution Co.',
    location: 'Phoenix, AZ',
    type: 'Full-Time',
    category: 'Warehouse',
    salaryMin: 17,
    salaryMax: 21,
    description:
      'Join our growing warehouse team! We are looking for dependable individuals to help with receiving, sorting, and shipping products. No prior experience required — we provide full training and opportunities for advancement. We believe in second chances and value dedication.',
    requirements: [
      'Ability to lift up to 50 lbs',
      'Reliable transportation',
      'Willingness to work flexible shifts',
      'Basic math skills',
    ],
    fairChance: true,
    postedDate: '2026-02-18',
    applicationUrl: 'https://example.com/apply/warehouse-associate',
  },
  'job-002': {
    id: 'job-002',
    title: 'Line Cook',
    company: 'Second Helpings Kitchen',
    location: 'Tempe, AZ',
    type: 'Full-Time',
    category: 'Food Service',
    salaryMin: 16,
    salaryMax: 19,
    description:
      'Fast-paced kitchen looking for a motivated line cook. We are a fair-chance employer that invests in our team. ServSafe training provided on the job. Great opportunity to build culinary skills and grow into a leadership role.',
    requirements: [
      'Ability to work in a fast-paced environment',
      'Willingness to learn food safety procedures',
      'Team player attitude',
      'Reliable and punctual',
    ],
    fairChance: true,
    postedDate: '2026-02-20',
    applicationUrl: 'https://example.com/apply/line-cook',
  },
  'job-003': {
    id: 'job-003',
    title: 'Construction Laborer',
    company: 'Sunrise Builders LLC',
    location: 'Scottsdale, AZ',
    type: 'Full-Time',
    category: 'Construction',
    salaryMin: 18,
    salaryMax: 24,
    description:
      'We are hiring construction laborers for residential and commercial projects across the Valley. Great pay, steady hours, and room to grow into specialized trades. We partner with re-entry programs and welcome all applicants with a strong work ethic.',
    requirements: [
      'Physically able to perform manual labor in Arizona heat',
      'Basic tool knowledge (training provided)',
      'Reliable transportation to job sites',
      'OSHA 10 certification preferred but not required',
    ],
    fairChance: true,
    postedDate: '2026-02-15',
    applicationUrl: 'https://example.com/apply/construction-laborer',
  },
  'job-004': {
    id: 'job-004',
    title: 'Retail Stocker — Night Shift',
    company: 'ValleyMart',
    location: 'Mesa, AZ',
    type: 'Part-Time',
    category: 'Retail',
    salaryMin: 15,
    salaryMax: 17,
    description:
      'Looking for night-shift stockers to unload trucks and organize merchandise. Quiet, independent work environment with consistent scheduling. Perfect for individuals who prefer an overnight schedule. We are proud to be a fair-chance employer.',
    requirements: [
      'Available 10 PM - 6 AM shifts',
      'Ability to stand for extended periods',
      'Attention to detail',
      'No retail experience necessary',
    ],
    fairChance: true,
    postedDate: '2026-02-19',
    applicationUrl: 'https://example.com/apply/retail-stocker',
  },
  'job-005': {
    id: 'job-005',
    title: 'CDL Truck Driver',
    company: 'Cactus Freight Lines',
    location: 'Chandler, AZ',
    type: 'Full-Time',
    category: 'Transportation',
    salaryMin: 22,
    salaryMax: 28,
    description:
      'Regional CDL truck driver needed for Valley-area deliveries. Home every night. We offer CDL training sponsorship for candidates who are committed to a career in transportation. Fair-chance applications welcomed and encouraged.',
    requirements: [
      "Valid Arizona driver's license (CDL preferred, will train)",
      'Clean driving record (past 3 years)',
      'Ability to pass DOT physical',
      'Customer service skills for delivery interactions',
    ],
    fairChance: true,
    postedDate: '2026-02-17',
    applicationUrl: 'https://example.com/apply/cdl-driver',
  },
  'job-006': {
    id: 'job-006',
    title: 'Landscape Crew Member',
    company: 'Desert Bloom Landscaping',
    location: 'Glendale, AZ',
    type: 'Full-Time',
    category: 'Landscaping',
    salaryMin: 16,
    salaryMax: 20,
    description:
      'Join our landscaping crew maintaining commercial and residential properties. Work outdoors, stay active, and learn valuable desert landscaping skills. Early morning starts, afternoons free. We hire based on attitude and work ethic, not background.',
    requirements: [
      'Physically fit and able to work outdoors in heat',
      'Reliable transportation',
      'Willingness to learn irrigation and plant care',
      'Team-oriented mindset',
    ],
    fairChance: true,
    postedDate: '2026-02-21',
    applicationUrl: 'https://example.com/apply/landscape-crew',
  },
  'job-007': {
    id: 'job-007',
    title: 'Dishwasher / Kitchen Prep',
    company: 'Fresh Start Cafe',
    location: 'Phoenix, AZ',
    type: 'Part-Time',
    category: 'Food Service',
    salaryMin: 14,
    salaryMax: 16,
    description:
      'Our community-focused cafe is looking for someone to help in the kitchen with dishwashing and basic food prep. Flexible hours, free meals during shifts, and a supportive team. We are a social enterprise dedicated to providing employment to those rebuilding their lives.',
    requirements: [
      'Ability to work on your feet',
      'Positive attitude',
      'Willingness to follow kitchen safety rules',
      'No experience needed — we train',
    ],
    fairChance: true,
    postedDate: '2026-02-22',
    applicationUrl: 'https://example.com/apply/dishwasher-prep',
  },
  'job-008': {
    id: 'job-008',
    title: 'Forklift Operator',
    company: 'Phoenix Logistics Hub',
    location: 'Phoenix, AZ',
    type: 'Full-Time',
    category: 'Warehouse',
    salaryMin: 19,
    salaryMax: 23,
    description:
      'Experienced or certified forklift operators needed for a busy distribution center. We offer competitive pay, overtime opportunities, and a pathway to shift lead positions. Forklift certification provided for the right candidate.',
    requirements: [
      'Forklift certification preferred (will certify)',
      'Ability to lift 40+ lbs regularly',
      'Warehouse experience a plus',
      'Strong safety awareness',
    ],
    fairChance: true,
    postedDate: '2026-02-16',
    applicationUrl: 'https://example.com/apply/forklift-operator',
  },
  'job-009': {
    id: 'job-009',
    title: 'Temp — Event Setup Crew',
    company: 'Valley Events Staffing',
    location: 'Phoenix, AZ',
    type: 'Temp',
    category: 'Other',
    salaryMin: 15,
    salaryMax: 18,
    description:
      'Temporary positions available for setting up and tearing down events at venues across the Phoenix metro area. Flexible scheduling — pick the events that work for you. Great way to earn income while looking for permanent employment.',
    requirements: [
      'Physical ability to move tables, chairs, and equipment',
      'Reliable transportation to various venues',
      'Available on weekends',
      'Positive, can-do attitude',
    ],
    fairChance: true,
    postedDate: '2026-02-20',
    applicationUrl: 'https://example.com/apply/event-setup',
  },
  'job-010': {
    id: 'job-010',
    title: 'Delivery Driver',
    company: 'QuickHaul Couriers',
    location: 'Tempe, AZ',
    type: 'Part-Time',
    category: 'Transportation',
    salaryMin: 16,
    salaryMax: 20,
    description:
      'Part-time delivery driver for local package and food deliveries. Use your own vehicle or we can provide one. Flexible hours that let you build a schedule around other commitments like classes, meetings, or appointments.',
    requirements: [
      "Valid Arizona driver's license",
      'Clean driving record',
      'Smartphone for navigation and delivery app',
      'Customer-friendly demeanor',
    ],
    fairChance: false,
    postedDate: '2026-02-14',
    applicationUrl: 'https://example.com/apply/delivery-driver',
  },
  'job-011': {
    id: 'job-011',
    title: 'Janitorial / Maintenance Tech',
    company: 'CleanSlate Services',
    location: 'Mesa, AZ',
    type: 'Full-Time',
    category: 'Other',
    salaryMin: 16,
    salaryMax: 19,
    description:
      'We are hiring janitorial and light maintenance technicians for commercial buildings. Evening shifts with predictable hours. Our company was founded on the mission of creating job opportunities for individuals re-entering the workforce.',
    requirements: [
      'Ability to follow cleaning checklists',
      'Basic maintenance skills (changing light bulbs, minor repairs)',
      'Reliable and trustworthy',
      'Background check conducted — fair-chance policy applies',
    ],
    fairChance: true,
    postedDate: '2026-02-13',
    applicationUrl: 'https://example.com/apply/janitorial-tech',
  },
  'job-012': {
    id: 'job-012',
    title: 'Concrete Finisher Helper',
    company: 'Ironwood Concrete',
    location: 'Gilbert, AZ',
    type: 'Temp',
    category: 'Construction',
    salaryMin: 17,
    salaryMax: 22,
    description:
      'Temp-to-hire opportunity learning concrete finishing for residential foundations and patios. Work alongside experienced crews who will teach you the trade. Strong performers get hired permanently with benefits. We actively recruit from re-entry programs.',
    requirements: [
      'Early morning availability (5 AM start)',
      'Physical endurance for demanding outdoor work',
      'Willingness to learn a skilled trade',
      'Dependable transportation',
    ],
    fairChance: true,
    postedDate: '2026-02-19',
    applicationUrl: 'https://example.com/apply/concrete-helper',
  },
};

// ---------------------------------------------------------------------------
// 22. Housing Listings (Lane 1 — Housing Search)
// ---------------------------------------------------------------------------

const housing_listings: Record<string, any> = {
  'hsg-001': {
    id: 'hsg-001',
    name: 'Phoenix Rise Sober Living',
    type: 'sober_living',
    address: '2415 N 24th St',
    city: 'Phoenix, AZ 85008',
    priceMin: 550,
    priceMax: 750,
    pricePeriod: 'month',
    availability: 'available',
    distance: 3.2,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management'],
    description:
      'A structured sober living home in central Phoenix offering a supportive recovery environment. We provide weekly house meetings, peer accountability, and connections to local recovery resources. Residents are expected to maintain sobriety, attend meetings, and contribute to household chores.',
    rules: ['Zero-tolerance substance policy', 'Curfew 10 PM weeknights, 12 AM weekends', 'Weekly drug testing', 'Must attend 3 meetings per week', 'Guest hours 10 AM - 8 PM'],
    requirements: ['30 days clean and sober', 'Valid ID', 'Proof of income or active job search', 'Background check (fair chance)'],
    contactPhone: '(602) 555-0101',
    contactEmail: 'intake@phoenixrise.example.com',
    applicationUrl: 'https://example.com/apply/phoenix-rise',
    acceptsVouchers: false,
    capacity: 12,
    currentOccupancy: 9,
  },
  'hsg-002': {
    id: 'hsg-002',
    name: 'New Beginnings Transitional Housing',
    type: 'transitional',
    address: '1830 W McDowell Rd',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 400,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 5.1,
    amenities: ['meals', 'case_management', 'job_training', 'accessible'],
    description:
      'Transitional housing program for individuals re-entering the community after incarceration. We offer up to 24 months of housing, case management, employment assistance, and life skills training. Sliding-scale rent based on income. Partnered with Maricopa County Re-Entry services.',
    rules: ['Participate in case management plan', 'Maintain employment or active job search', 'No alcohol or drugs on premises', 'Attend weekly life skills workshop', 'Comply with house responsibilities'],
    requirements: ['Recently released from incarceration (within 12 months)', 'Willingness to follow program rules', 'Active participation in re-entry plan'],
    contactPhone: '(602) 555-0202',
    contactEmail: 'apply@newbeginnings.example.com',
    applicationUrl: 'https://example.com/apply/new-beginnings',
    acceptsVouchers: true,
    capacity: 40,
    currentOccupancy: 40,
  },
  'hsg-003': {
    id: 'hsg-003',
    name: 'Desert Haven Apartments',
    type: 'affordable',
    address: '4520 E Thomas Rd',
    city: 'Phoenix, AZ 85018',
    priceMin: 650,
    priceMax: 950,
    pricePeriod: 'month',
    availability: 'available',
    distance: 7.3,
    amenities: ['wifi', 'parking', 'accessible', 'family_friendly'],
    description:
      'Affordable apartment complex with income-restricted units for individuals and families. Located near public transit, shopping, and employment centers. On-site laundry facilities, community room, and playground. No criminal background disqualification — fair chance screening.',
    rules: ['Standard lease agreement', 'No smoking in units', 'Quiet hours 10 PM - 7 AM', 'Pet deposit required for animals'],
    requirements: ['Income at or below 60% AMI', 'Pass credit check (flexible standards)', 'First month rent + $300 deposit', 'Valid ID and proof of income'],
    contactPhone: '(602) 555-0303',
    contactEmail: 'leasing@deserthaven.example.com',
    applicationUrl: 'https://example.com/apply/desert-haven',
    acceptsVouchers: true,
    capacity: 80,
    currentOccupancy: 73,
  },
  'hsg-004': {
    id: 'hsg-004',
    name: 'CASS Emergency Shelter',
    type: 'shelter',
    address: '230 S 12th Ave',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 4.8,
    amenities: ['meals', 'security', 'case_management', 'accessible'],
    description:
      'Central Arizona Shelter Services provides emergency overnight shelter, meals, and access to case managers who can help connect you with longer-term housing, employment, and benefits. Walk-in intake available daily.',
    rules: ['Check in by 5 PM daily', 'No weapons or contraband', 'Respectful behavior toward staff and residents', 'Sobriety required on premises'],
    requirements: ['Photo ID preferred but not required', 'TB screening (available on-site)'],
    contactPhone: '(602) 555-0404',
    contactEmail: 'info@cass-shelter.example.com',
    applicationUrl: 'https://example.com/apply/cass',
    acceptsVouchers: false,
    capacity: 500,
    currentOccupancy: 420,
  },
  'hsg-005': {
    id: 'hsg-005',
    name: 'Maryvale Section 8 Homes',
    type: 'section_8',
    address: '5135 W Indian School Rd',
    city: 'Phoenix, AZ 85031',
    priceMin: 200,
    priceMax: 500,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 12.4,
    amenities: ['parking', 'family_friendly', 'pet_friendly'],
    description:
      'Single-family homes and duplexes accepting Housing Choice Vouchers (Section 8). Quiet residential neighborhood in Maryvale with yards, close to schools and parks. Landlord partners with housing authority for streamlined move-in.',
    rules: ['Standard Section 8 lease terms', 'Maintain property and yard', 'Annual income recertification', 'Background check with fair chance consideration'],
    requirements: ['Active Housing Choice Voucher', 'Income verification', 'Voucher briefing completed', 'Deposit (up to 1 month rent portion)'],
    contactPhone: '(602) 555-0505',
    contactEmail: 'section8@maryvale-homes.example.com',
    applicationUrl: 'https://example.com/apply/maryvale-s8',
    acceptsVouchers: true,
    capacity: 25,
    currentOccupancy: 23,
  },
  'hsg-006': {
    id: 'hsg-006',
    name: 'Second Chance Sober Home — Men',
    type: 'sober_living',
    address: '3602 N 16th St',
    city: 'Phoenix, AZ 85016',
    priceMin: 500,
    priceMax: 650,
    pricePeriod: 'month',
    availability: 'available',
    distance: 4.1,
    amenities: ['wifi', 'parking', 'drug_testing', 'job_training'],
    description:
      'Men-only sober living home with structured programming. Residents participate in daily chores, job readiness workshops, and weekly accountability groups. Close to bus lines and shopping. Staff available 24/7. Many of our staff are in recovery themselves.',
    rules: ['Men only, 18+', 'Zero-tolerance substance policy', 'Must maintain employment after 30 days', 'Random drug testing', 'Curfew 11 PM'],
    requirements: ['14 days minimum sobriety', 'Willingness to work a recovery program', 'Government-issued ID', 'First week rent at move-in'],
    contactPhone: '(602) 555-0606',
    contactEmail: 'apply@secondchancesober.example.com',
    applicationUrl: 'https://example.com/apply/second-chance-men',
    acceptsVouchers: false,
    capacity: 8,
    currentOccupancy: 6,
  },
  'hsg-007': {
    id: 'hsg-007',
    name: 'Tempe Bridge Transitional Program',
    type: 'transitional',
    address: '1250 E Apache Blvd',
    city: 'Tempe, AZ 85281',
    priceMin: 100,
    priceMax: 350,
    pricePeriod: 'month',
    availability: 'available',
    distance: 9.6,
    amenities: ['wifi', 'meals', 'case_management', 'job_training', 'accessible'],
    description:
      'Bridge housing program in partnership with Tempe Community Action Agency. Designed for individuals transitioning out of homelessness or incarceration. Up to 18 months of supportive housing with on-site case managers, group counseling, and employment services.',
    rules: ['Active participation in individualized service plan', 'Maintain sobriety', 'Contribute to community living (cooking rotation, cleaning)', 'Save 30% of income in escrow account'],
    requirements: ['Referral from community agency or self-referral accepted', 'Income below 30% AMI', 'Commitment to housing stability plan'],
    contactPhone: '(480) 555-0707',
    contactEmail: 'housing@tempebridge.example.com',
    applicationUrl: 'https://example.com/apply/tempe-bridge',
    acceptsVouchers: true,
    capacity: 30,
    currentOccupancy: 24,
  },
  'hsg-008': {
    id: 'hsg-008',
    name: 'Mesa Oasis Family Shelter',
    type: 'shelter',
    address: '616 S Country Club Dr',
    city: 'Mesa, AZ 85210',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 15.2,
    amenities: ['meals', 'security', 'family_friendly', 'case_management', 'accessible'],
    description:
      "Family-focused emergency shelter providing safe beds, meals, and wraparound services for families experiencing homelessness. Children's programs, parenting classes, and rapid re-housing assistance available. Private family rooms ensure dignity and safety.",
    rules: ['Families with children prioritized', 'Check-in by 6 PM', 'Attend weekly case management meeting', 'No drugs, alcohol, or weapons'],
    requirements: ['At least one child under 18', 'Photo ID for adults (assistance available if needed)', 'Complete intake assessment'],
    contactPhone: '(480) 555-0808',
    contactEmail: 'families@mesaoasis.example.com',
    applicationUrl: 'https://example.com/apply/mesa-oasis',
    acceptsVouchers: false,
    capacity: 60,
    currentOccupancy: 48,
  },
  'hsg-009': {
    id: 'hsg-009',
    name: "Grace House — Women's Sober Living",
    type: 'sober_living',
    address: '4220 N 20th St',
    city: 'Phoenix, AZ 85016',
    priceMin: 525,
    priceMax: 700,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 5.5,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management'],
    description:
      "Women-only sober living home in a quiet Phoenix neighborhood. Supportive, nurturing environment with trauma-informed care. Weekly women's recovery meetings on-site. Partnerships with local employers for job placement. Children may be accommodated in some rooms.",
    rules: ['Women only, 18+', 'Zero-tolerance substance policy', 'Attend minimum 4 recovery meetings per week', 'Random drug testing', 'Participate in house meetings'],
    requirements: ['Minimum 7 days sober', 'Government-issued ID', 'Commitment to recovery program', 'First two weeks rent at move-in'],
    contactPhone: '(602) 555-0909',
    contactEmail: 'apply@gracehouse.example.com',
    applicationUrl: 'https://example.com/apply/grace-house',
    acceptsVouchers: false,
    capacity: 10,
    currentOccupancy: 10,
  },
  'hsg-010': {
    id: 'hsg-010',
    name: 'Chandler Crossing Affordable Living',
    type: 'affordable',
    address: '777 W Chandler Blvd',
    city: 'Chandler, AZ 85225',
    priceMin: 700,
    priceMax: 1100,
    pricePeriod: 'month',
    availability: 'available',
    distance: 18.3,
    amenities: ['wifi', 'parking', 'accessible', 'family_friendly', 'pet_friendly'],
    description:
      'LIHTC (Low-Income Housing Tax Credit) apartment community in Chandler. 1, 2, and 3-bedroom units available. Community pool, fitness center, and business center. Convenient to Chandler Fashion Center and employers along the Price Road corridor.',
    rules: ['Income qualification required annually', '12-month lease minimum', 'No smoking on property', 'Pets require $250 deposit and veterinary records'],
    requirements: ['Income at or below 50% AMI', 'Complete application and screening', 'First and last month rent', 'Government ID and income documentation'],
    contactPhone: '(480) 555-1010',
    contactEmail: 'leasing@chandlercrossing.example.com',
    applicationUrl: 'https://example.com/apply/chandler-crossing',
    acceptsVouchers: true,
    capacity: 120,
    currentOccupancy: 108,
  },
  'hsg-011': {
    id: 'hsg-011',
    name: 'St. Vincent de Paul Overflow Shelter',
    type: 'shelter',
    address: '1075 W Jackson St',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 4.2,
    amenities: ['meals', 'security', 'accessible'],
    description:
      'Walk-in overflow shelter providing emergency beds, hot meals, and resource navigation. Open seasonally and during extreme heat or cold events. Day-use resource center with showers, laundry, phone charging, and mail services. No prerequisites for entry.',
    rules: ['No weapons', 'Respectful behavior required', 'Quiet hours after 9 PM', 'Must vacate by 7 AM for day-use program'],
    requirements: ['No ID required', 'Walk-in basis, first come first served'],
    contactPhone: '(602) 555-1111',
    contactEmail: 'shelter@svdp-phoenix.example.com',
    applicationUrl: 'https://example.com/apply/svdp-overflow',
    acceptsVouchers: false,
    capacity: 200,
    currentOccupancy: 155,
  },
  'hsg-012': {
    id: 'hsg-012',
    name: 'Scottsdale Section 8 Townhomes',
    type: 'section_8',
    address: '8120 E Indian Bend Rd',
    city: 'Scottsdale, AZ 85250',
    priceMin: 250,
    priceMax: 600,
    pricePeriod: 'month',
    availability: 'full',
    distance: 14.7,
    amenities: ['parking', 'family_friendly', 'accessible'],
    description:
      'Townhome community in south Scottsdale accepting Housing Choice Vouchers. 2 and 3-bedroom units with attached garages. Walking distance to public transit and shopping. Professional property management ensures well-maintained community.',
    rules: ['Section 8 program compliance required', 'Maintain unit and surrounding area', 'No unauthorized occupants', 'Report income changes within 30 days'],
    requirements: ['Active Housing Choice Voucher from housing authority', 'Income verification and background check', 'Good standing with previous landlords', 'Security deposit negotiable'],
    contactPhone: '(480) 555-1212',
    contactEmail: 'voucher@scottsdale-townhomes.example.com',
    applicationUrl: 'https://example.com/apply/scottsdale-s8',
    acceptsVouchers: true,
    capacity: 35,
    currentOccupancy: 35,
  },
  'hsg-013': {
    id: 'hsg-013',
    name: 'Restore Recovery Residence',
    type: 'sober_living',
    address: '1918 E Camelback Rd',
    city: 'Phoenix, AZ 85016',
    priceMin: 600,
    priceMax: 800,
    pricePeriod: 'month',
    availability: 'available',
    distance: 6.0,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management', 'job_training'],
    description:
      'AZDHS-licensed recovery residence offering structured programming for men and women in early recovery. Clinical support available on-site. MAT-friendly. Insurance may cover partial costs. Residents benefit from IOP groups, life skills education, and vocational assistance.',
    rules: ['Follow individualized recovery plan', 'Zero-tolerance substance policy', 'Attend all scheduled programming', 'Maintain household responsibilities', 'Visitors by appointment only'],
    requirements: ['Commitment to recovery', 'Insurance or ability to self-pay', 'Medical clearance', 'Intake assessment and interview'],
    contactPhone: '(602) 555-1313',
    contactEmail: 'admissions@restorerecovery.example.com',
    applicationUrl: 'https://example.com/apply/restore-recovery',
    acceptsVouchers: false,
    capacity: 16,
    currentOccupancy: 11,
  },
  'hsg-014': {
    id: 'hsg-014',
    name: 'Glendale Gateway Apartments',
    type: 'affordable',
    address: '6025 W Glendale Ave',
    city: 'Glendale, AZ 85301',
    priceMin: 600,
    priceMax: 900,
    pricePeriod: 'month',
    availability: 'available',
    distance: 11.8,
    amenities: ['wifi', 'parking', 'family_friendly', 'pet_friendly', 'accessible'],
    description:
      'Affordable housing community in west Glendale near entertainment district. Studios, 1-bedroom, and 2-bedroom units available. Managed by a nonprofit with on-site resident services including financial coaching, after-school tutoring, and community events.',
    rules: ['Income qualification required annually', '12-month lease minimum', 'No smoking on property', 'Pets require $250 deposit and veterinary records'],
    requirements: ['Income at or below 60% AMI', 'Complete application and screening', 'First and last month rent', 'Government ID and income documentation'],
    contactPhone: '(623) 555-1414',
    contactEmail: 'apply@glendalegateway.example.com',
    applicationUrl: 'https://example.com/apply/glendale-gateway',
    acceptsVouchers: true,
    capacity: 95,
    currentOccupancy: 82,
  },
  'hsg-015': {
    id: 'hsg-015',
    name: 'Hope Springs Transitional Shelter',
    type: 'transitional',
    address: '3340 W Durango St',
    city: 'Phoenix, AZ 85009',
    priceMin: 0,
    priceMax: 250,
    pricePeriod: 'month',
    availability: 'available',
    distance: 6.7,
    amenities: ['meals', 'case_management', 'job_training', 'security'],
    description:
      'Transitional shelter specifically designed for men and women leaving incarceration. Up to 12 months of housing. Intensive case management, anger management classes, substance abuse counseling referrals, and job placement services. Graduated program with increasing independence.',
    rules: ['Follow graduated program structure', 'No substance use', 'Mandatory case management meetings', 'Community service hours required', 'Save 25% of earnings'],
    requirements: ['Released within past 6 months', 'Referral from corrections, parole, or community agency', 'Willingness to participate in all programming'],
    contactPhone: '(602) 555-1515',
    contactEmail: 'referrals@hopesprings.example.com',
    applicationUrl: 'https://example.com/apply/hope-springs',
    acceptsVouchers: false,
    capacity: 50,
    currentOccupancy: 38,
  },
  'hsg-016': {
    id: 'hsg-016',
    name: 'Sunrise Sober Living — East Valley',
    type: 'sober_living',
    address: '2840 E Southern Ave',
    city: 'Mesa, AZ 85204',
    priceMin: 475,
    priceMax: 625,
    pricePeriod: 'month',
    availability: 'available',
    distance: 16.1,
    amenities: ['wifi', 'parking', 'drug_testing'],
    description:
      'Affordable sober living in the East Valley. Quiet neighborhood, close to transit and light rail. Shared rooms to keep costs low. House manager on-site. Weekly BBQs and group outings build community and accountability. We welcome those starting over.',
    rules: ['Sobriety is mandatory', 'Weekly drug screens', 'House chores on rotation', 'Curfew 10 PM Sunday-Thursday', 'No overnight guests'],
    requirements: ['Desire to live sober', 'Government-issued ID', 'Able to pay weekly ($120/week)', 'Interview with house manager'],
    contactPhone: '(480) 555-1616',
    contactEmail: 'info@sunrisesober.example.com',
    applicationUrl: 'https://example.com/apply/sunrise-east-valley',
    acceptsVouchers: false,
    capacity: 12,
    currentOccupancy: 8,
  },
  'hsg-017': {
    id: 'hsg-017',
    name: 'AZ Housing Authority — Westside',
    type: 'section_8',
    address: '3838 N 35th Ave',
    city: 'Phoenix, AZ 85017',
    priceMin: 150,
    priceMax: 450,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 8.3,
    amenities: ['parking', 'accessible', 'family_friendly'],
    description:
      'Project-based Section 8 housing managed by the Arizona Housing Authority. Mix of 1 to 4-bedroom units in a gated community. On-site management office, community garden, and playground. Priority given to veterans, persons with disabilities, and families.',
    rules: ['Comply with housing authority lease', 'Report income changes promptly', 'Maintain unit cleanliness', 'No unauthorized modifications to unit'],
    requirements: ['Complete HCV application through housing authority', 'Meet HUD income guidelines', 'Pass background screening (case-by-case review)', 'Provide required documentation'],
    contactPhone: '(602) 555-1717',
    contactEmail: 'applications@azhousing.example.com',
    applicationUrl: 'https://example.com/apply/az-housing-westside',
    acceptsVouchers: true,
    capacity: 70,
    currentOccupancy: 66,
  },
  'hsg-018': {
    id: 'hsg-018',
    name: "Phoenix Rescue Mission — Men's Center",
    type: 'shelter',
    address: '1801 S 35th Ave',
    city: 'Phoenix, AZ 85009',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 7.9,
    amenities: ['meals', 'security', 'case_management', 'job_training'],
    description:
      'Emergency and transitional shelter for men. Hot meals served three times daily. Clothing and hygiene supplies provided. On-site chapel services, addiction recovery program, and job readiness workshops. Long-term program available for men committed to transformation.',
    rules: ['Men only, 18+', 'No drugs, alcohol, or weapons', 'Attend chapel service or alternative programming', 'Participate in assigned chores', 'Respectful conduct at all times'],
    requirements: ['Walk-in welcome', 'No ID required for emergency bed', 'TB test required for long-term program (available on-site)'],
    contactPhone: '(602) 555-1818',
    contactEmail: 'info@phoenixrescue.example.com',
    applicationUrl: 'https://example.com/apply/phoenix-rescue-men',
    acceptsVouchers: false,
    capacity: 250,
    currentOccupancy: 195,
  },
};

// ---------------------------------------------------------------------------
// 23. Campaigns (Lane 3 — Donate)
// ---------------------------------------------------------------------------

const campaigns: Record<string, any> = {
  'winter-shelter': {
    id: 'winter-shelter',
    name: 'Winter Shelter Fund',
    description: 'Help us keep emergency shelters open through the cold months. Every night matters when temperatures drop below freezing.',
    goal: 15000,
    raised: 11240,
    iconName: 'Home',
  },
  'employment-ready': {
    id: 'employment-ready',
    name: 'Employment Ready Program',
    description: 'Fund interview clothes, resume services, and job training for community members ready to re-enter the workforce.',
    goal: 8000,
    raised: 3650,
    iconName: 'Briefcase',
  },
  'community-kitchen': {
    id: 'community-kitchen',
    name: 'Community Kitchen',
    description: 'Our kitchen serves 200+ meals daily. Help us keep the stoves on and the tables full for those who need it most.',
    goal: 12000,
    raised: 9800,
    iconName: 'Utensils',
  },
  'phone-connectivity': {
    id: 'phone-connectivity',
    name: 'Phone & Connectivity',
    description: 'A phone number is the lifeline to jobs, housing, and services. Fund prepaid phones and charging stations.',
    goal: 5000,
    raised: 2100,
    iconName: 'Phone',
  },
};

// ---------------------------------------------------------------------------
// 24. Employers (Admin — Employment)
// ---------------------------------------------------------------------------

const employers: Record<string, any> = {
  'emp-1': {
    id: 'emp-1',
    name: 'Southwest Construction Co.',
    industry: 'Construction',
    fairChance: true,
    openPositions: 5,
    placements: 12,
  },
  'emp-2': {
    id: 'emp-2',
    name: 'Desert Valley Foods',
    industry: 'Food Service',
    fairChance: true,
    openPositions: 3,
    placements: 8,
  },
  'emp-3': {
    id: 'emp-3',
    name: 'Phoenix Auto Group',
    industry: 'Automotive',
    fairChance: false,
    openPositions: 2,
    placements: 4,
  },
  'emp-4': {
    id: 'emp-4',
    name: 'Sunrise Landscaping',
    industry: 'Landscaping',
    fairChance: true,
    openPositions: 7,
    placements: 15,
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const DEMO_DATA: Record<string, Record<string, any>> = {
  goals,
  appointments,
  jobApplications,
  documents,
  conversations,
  messages,
  notifications,
  budgets,
  journal_entries,
  achievements,
  user_progress,
  daily_checkins,
  posts,
  resources,
  courses,
  users,
  threads,
  replies,
  support_groups,
  events,
  resumes,
  jobs,
  housing_listings,
  campaigns,
  employers,
};
