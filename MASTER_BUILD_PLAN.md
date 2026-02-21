# NEW FREEDOM RECOVERY PLATFORM — MASTER BUILD PLAN
## End-to-End Architecture, Build Requirements & Repository Reference
### For Claude Code Autonomous Build Sessions

---

## TABLE OF CONTENTS
1. [Project Overview & Mission](#1-project-overview--mission)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Repository Downloads — Complete List with URLs](#4-repository-downloads)
5. [Shared Infrastructure & Auth](#5-shared-infrastructure--auth)
6. [Firestore Data Model](#6-firestore-data-model)
7. [Lane 1: Re-Entry Platform — Build Spec](#7-lane-1-re-entry-platform)
8. [Lane 2: Interactive Step Experience — Build Spec](#8-lane-2-interactive-step-experience)
9. [Lane 3: My Struggle Platform — Build Spec](#9-lane-3-my-struggle-platform)
10. [Cross-Cutting Features — Build Spec](#10-cross-cutting-features)
11. [Admin Dashboard — Build Spec](#11-admin-dashboard)
12. [AI Integration — Build Spec](#12-ai-integration)
13. [Phased Build Timeline](#13-phased-build-timeline)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Cost Projections](#15-cost-projections)
16. [Claude Code Session Instructions](#16-claude-code-session-instructions)

---

## 1. PROJECT OVERVIEW & MISSION

### What Is This
A three-lane digital platform serving justice-involved individuals, people in recovery, and people experiencing homelessness. Built for REPrieve AZ (behavioral health center, Phoenix AZ, 370-400 members, 92.5% efficacy rate, 99% employment rate for graduates).

### The Three Lanes
1. **Re-Entry Platform** — Agentic AI-powered case management, employment, housing, wellness tools for people leaving incarceration
2. **Interactive Step Experience** — LMS with Joe McDonald's 12-step curriculum, video content, assessments, progress tracking
3. **My Struggle** — Nonprofit social network for people experiencing homelessness (mentor matching, resource locator, community stories, donations)

### Key Principles
- **Shared identity/auth** across all three lanes (one account, three experiences)
- **Data flows between lanes** (step completion in Lane 2 feeds progress in Lane 1, community engagement in Lane 3 feeds social proof everywhere)
- **Mobile-first** — many users will access from phones with limited data
- **Offline-capable** — critical features must work without internet
- **Trauma-informed design** — warm, non-judgmental, celebrates progress
- **Safety-first** — content moderation, crisis detection, mandatory for Lane 3

### Ownership
- Brian owns all process documentation and platform IP
- Joe McDonald owns 12-step curriculum copyright (licensed for platform use)
- Video content owned and licensed for platform delivery

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHARED INFRASTRUCTURE                        │
│  Firebase Auth │ Firestore │ Firebase Storage │ Cloud Functions  │
│  Claude API │ Stripe │ Firebase Cloud Messaging │ Google Maps    │
└──────────┬──────────────────┬──────────────────┬────────────────┘
           │                  │                  │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   LANE 1    │   │   LANE 2    │   │   LANE 3    │
    │  Re-Entry   │   │    Step     │   │ My Struggle │
    │  Platform   │   │ Experience  │   │  Platform   │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                  │                  │
    ┌──────▼──────────────────▼──────────────────▼──────┐
    │              ADMIN DASHBOARD                       │
    │  React-Admin + react-admin-firebase                │
    │  Analytics │ Reporting │ Case Management           │
    └──────────────────────────────────────────────────┘
```

### Monorepo Structure
```
reprieve-platform/
├── packages/
│   ├── shared/              # Shared components, hooks, utils, types
│   │   ├── components/      # UI components (Button, Card, Avatar, etc.)
│   │   ├── hooks/           # useAuth, useFirestore, useNotifications
│   │   ├── services/        # Firebase config, Claude API, Stripe
│   │   ├── types/           # TypeScript interfaces shared across lanes
│   │   └── utils/           # Helpers, formatters, validators
│   ├── lane1-reentry/       # Re-Entry Platform app
│   ├── lane2-steps/         # Interactive Step Experience app
│   ├── lane3-mystuggle/     # My Struggle Platform app
│   └── admin/               # Admin Dashboard app
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   └── functions/           # Cloud Functions (notifications, AI, reports)
├── package.json             # Workspace root
├── turbo.json               # Turborepo config (or nx.json)
└── README.md
```

---

## 3. TECHNOLOGY STACK

### Core Stack
| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Frontend** | React | 18+ | Existing codebase, massive ecosystem |
| **Language** | TypeScript | 5+ | Type safety across monorepo |
| **Build** | Vite | 5+ | Fast builds, HMR, better than CRA |
| **Monorepo** | Turborepo or Nx | Latest | Shared packages, parallel builds |
| **Styling** | Tailwind CSS + shadcn/ui | Latest | Rapid UI, accessible components |
| **State** | Zustand | 4+ | Lightweight, no boilerplate |
| **Routing** | React Router | 6+ | Standard, nested routes |
| **Forms** | React Hook Form + Zod | Latest | Validation, performance |

### Backend / Infrastructure
| Layer | Technology | Why |
|-------|-----------|-----|
| **Auth** | Firebase Auth | Email/password, Google, phone, anonymous |
| **Database** | Cloud Firestore | Real-time, offline support, security rules |
| **Storage** | Firebase Storage | Files, images, videos, documents |
| **Functions** | Firebase Cloud Functions | Serverless backend logic |
| **Hosting** | Firebase Hosting + Vercel | Static + SSR |
| **Push** | Firebase Cloud Messaging | Free push notifications |

### Third-Party Services
| Service | Purpose | Cost |
|---------|---------|------|
| **Claude API** (claude-sonnet-4-20250514) | AI agentic guidance, resume coaching, assessments | ~$50-200/mo |
| **Stripe** | Donations, payments | 2.9% + 30¢/transaction |
| **Mux** | Video hosting/streaming for LMS | ~$20-50/mo |
| **Google Maps Platform** | Resource locator, navigation | $200/mo free credit |
| **Perspective API** (Google/Jigsaw) | Content moderation/toxicity detection | Free |
| **SendGrid** | Transactional email | 100/day free |
| **Algolia or Typesense** | Full-text search | Free tier |

### NPM Packages (install in shared)
```bash
# Core
npm install react react-dom react-router-dom zustand
npm install -D typescript @types/react @types/react-dom vite

# Firebase
npm install firebase

# UI
npm install tailwindcss @tailwindcss/forms
npm install @radix-ui/react-* # shadcn/ui primitives
npm install lucide-react # Icons
npm install recharts # Charts
npm install react-toastify # Toast notifications

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Media
npm install react-player # Video player
npm install @mux/mux-player-react # Mux video (optional)

# Communication
npm install @anthropic-ai/sdk # Claude API
npm install @stripe/react-stripe-js @stripe/stripe-js

# Surveys & Assessments
npm install survey-core survey-react-ui survey-creator-core survey-creator-react

# Scheduling
npm install react-big-calendar date-fns

# Maps
npm install @vis.gl/react-google-maps

# Rich Text
npm install @tiptap/react @tiptap/starter-kit

# Internationalization
npm install react-i18next i18next

# PDF Generation
npm install @react-pdf/renderer

# Data Export
npm install papaparse xlsx

# Kanban
npm install @asseinfo/react-kanban

# Offline/PWA
npm install workbox-webpack-plugin workbox-precaching workbox-routing
```

---

## 4. REPOSITORY DOWNLOADS — COMPLETE LIST WITH URLS

### 🔴 CRITICAL — Clone These First (Foundation Repos)

#### 1. Social Network + Firebase Foundation
- **Repo:** react-social-network (Red Gold / Qolzam)
- **URL:** https://github.com/red-gold/react-social-network
- **Clone:** `git clone https://github.com/red-gold/react-social-network.git`
- **What it gives you:** Full social platform (posts, comments, likes, profiles, photos, notifications, circles) built on Firebase/Firestore. Supports Firebase AND AWS via InversifyJS. React + React Native ready. MIT license.
- **Use for:** My Struggle social feed foundation, community features across all lanes

#### 2. LMS + Firebase Foundation
- **Repo:** Nekomy Platform (E-Learning React)
- **URL:** https://github.com/nicedoc/nekomy
- **Clone:** `git clone https://github.com/nicedoc/nekomy.git`
- **What it gives you:** Course management, progress tracking, PWA/SPA, React + Firebase
- **Use for:** Interactive Step Experience (Lane 2) LMS engine

#### 3. Admin Dashboard + Firebase
- **Repo:** react-admin-firebase
- **URL:** https://github.com/benwinding/react-admin-firebase
- **Clone:** `git clone https://github.com/benwinding/react-admin-firebase.git`
- **Also install:** `npm install react-admin ra-data-firebase-client`
- **What it gives you:** Maps Firestore collections directly to admin CRUD panels. Auth with Google/Facebook/GitHub. File upload to Firebase Storage.
- **Use for:** Business/center admin dashboard

#### 4. Donation System + Stripe + Firebase
- **Repo:** donation-site-stripe-reactjs
- **URL:** https://github.com/afif-dev/donation-site-stripe-reactjs
- **Clone:** `git clone https://github.com/afif-dev/donation-site-stripe-reactjs.git`
- **What it gives you:** React + Stripe + Tailwind + Cloud Firestore. Webhook logging. Donation campaigns.
- **Use for:** My Struggle nonprofit donation system

### 🟡 HIGH PRIORITY — Clone These Next (Major Features)

#### 5. Video Calling / Telehealth (WebRTC)
- **Repo:** mooz
- **URL:** https://github.com/muzam1l/mooz
- **Clone:** `git clone https://github.com/muzam1l/mooz.git`
- **What it gives you:** P2P mesh video conferencing. React + Zustand + WebRTC + Socket.IO. Audio, video, screen-share, chat. Extensible for recording.
- **Use for:** Mentor sessions, case manager calls, group therapy, AA meetings

#### 6. Resume Builder + Job Tracker + Mock Interviews (React + Firebase)
- **Repo:** career_portal
- **URL:** https://github.com/navneeth31/career_portal
- **Clone:** `git clone https://github.com/navneeth31/career_portal.git`
- **What it gives you:** Resume builder with PDF export, job application tracker, mock interview simulator. React + Firebase Auth + Tailwind. MIT license.
- **Use for:** Employment readiness in Lane 1

#### 7. Professional Resume Builder (Reference/Self-hosted)
- **Repo:** Reactive Resume
- **URL:** https://github.com/AmruthPillai/Reactive-Resume
- **Clone:** `git clone https://github.com/AmruthPillai/Reactive-Resume.git`
- **What it gives you:** 25k+ stars. Professional templates. PDF export. Self-hosted Docker. No tracking. MIT license.
- **Use for:** Reference architecture for advanced resume features

#### 8. Resume Builder + Parser (Client-side)
- **Repo:** OpenResume
- **URL:** https://github.com/xitanggg/open-resume
- **Clone:** `git clone https://github.com/xitanggg/open-resume.git`
- **What it gives you:** ATS-friendly resume builder + resume parser. Next.js + React + Redux + Tailwind. Runs 100% client-side.
- **Use for:** Resume parsing feature, ATS-friendly templates

#### 9. Job Board (AI-powered)
- **Repo:** open-jobboard
- **URL:** https://github.com/Riminder/open-jobboard
- **Clone:** `git clone https://github.com/Riminder/open-jobboard.git`
- **What it gives you:** AI-powered job matching. React + Gatsby. Headless CMS. Customizable.
- **Use for:** Fair-chance employer job board

#### 10. File Management System (React + Firebase)
- **Repo:** react-firebase-file-management-system
- **URL:** https://github.com/RamanSharma100/react-firebase-file-management-system
- **Clone:** `git clone https://github.com/RamanSharma100/react-firebase-file-management-system.git`
- **What it gives you:** File upload, folders/subfolders, file creation/editing. React + Firebase (Vite + Firebase 10). MIT license.
- **Use for:** Document vault (IDs, birth certificates, court papers)

#### 11. Budget/Finance Tracker (React + Firebase)
- **Repo:** Financely
- **URL:** https://github.com/Ajay-Chaudhari01001/Financely
- **Clone:** `git clone https://github.com/Ajay-Chaudhari01001/Financely.git`
- **What it gives you:** Income/expense tracking with charts. Firebase Auth + Firestore + Ant Design + ApexCharts.
- **Use for:** Financial literacy and budget management

#### 12. Mood Tracker + Journaling (React + Firebase)
- **Repo:** mood-tracker
- **URL:** https://github.com/jWytrzes/mood-tracker
- **Clone:** `git clone https://github.com/jWytrzes/mood-tracker.git`
- **What it gives you:** Daily mood selection + journal notes. Calendar visualization. Mood percentage charts. React + Firebase.
- **Use for:** Daily wellness check-ins, recovery journaling

#### 13. Kanban Task Board (React + Firebase)
- **Repo:** kanbanFirebase
- **URL:** https://github.com/lucaszebre/kanbanFirebase
- **Clone:** `git clone https://github.com/lucaszebre/kanbanFirebase.git`
- **What it gives you:** Kanban boards with drag-and-drop. Multiple boards, columns, subtasks. Next.js + React + Firebase Auth + Realtime DB + TypeScript. MIT license.
- **Use for:** Action plan management, re-entry task tracking

#### 14. Gamification Engine (Reference)
- **Repo:** Oasis
- **URL:** https://github.com/isuru89/oasis
- **Clone:** `git clone https://github.com/isuru89/oasis.git`
- **What it gives you:** Event-driven gamification: points, badges, milestones, leaderboards, challenges, ratings. Rule-based rewards. Ranks (gold/silver/bronze).
- **Use for:** Achievement/badge system logic, milestone celebrations

#### 15. Services Locator (Reference Data Model)
- **Repo:** homeless-helper
- **URL:** https://github.com/PCNI/homeless-helper
- **Clone:** `git clone https://github.com/PCNI/homeless-helper.git`
- **What it gives you:** Data model for: shelters, food, medical, legal, employment resources. Bed availability. SMS integration. Resource type schema.
- **Use for:** Resource locator data architecture for My Struggle

#### 16. Firebase Admin Boilerplate
- **Repo:** react-firebase-admin (CreateThrive)
- **URL:** https://github.com/CreateThrive/react-firebase-admin
- **Clone:** `git clone https://github.com/CreateThrive/react-firebase-admin.git`
- **What it gives you:** Full boilerplate: React + Firebase + Redux. Auth, authorization, Firestore, file upload, CI/CD, PWA. Admin dashboard with user management.
- **Use for:** Admin panel reference, role-based access patterns

### 🟢 NPM INSTALL — No Clone Needed

| Package | Install | Purpose |
|---------|---------|---------|
| react-player | `npm i react-player` | Video player (YouTube, HLS, DASH, file) |
| recharts | `npm i recharts` | Charts and analytics visualization |
| @stripe/react-stripe-js | `npm i @stripe/react-stripe-js @stripe/stripe-js` | Stripe payment components |
| survey-core + survey-react-ui | `npm i survey-core survey-react-ui` | Survey/assessment rendering |
| survey-creator-core + survey-creator-react | `npm i survey-creator-core survey-creator-react` | No-code form/survey builder |
| react-big-calendar | `npm i react-big-calendar` | Calendar/scheduling UI |
| @vis.gl/react-google-maps | `npm i @vis.gl/react-google-maps` | Google Maps integration |
| react-award | `npm i react-award` | Achievement celebration animations |
| @tiptap/react + @tiptap/starter-kit | `npm i @tiptap/react @tiptap/starter-kit` | Rich text editor (journaling, stories) |
| react-i18next + i18next | `npm i react-i18next i18next` | Multi-language (Spanish) |
| @react-pdf/renderer | `npm i @react-pdf/renderer` | PDF generation (reports, certificates) |
| papaparse | `npm i papaparse` | CSV export |
| xlsx (SheetJS) | `npm i xlsx` | Excel export |
| react-toastify | `npm i react-toastify` | In-app toast notifications |
| @asseinfo/react-kanban | `npm i @asseinfo/react-kanban` | Kanban board component |
| workbox-precaching | `npm i workbox-precaching` | PWA offline support |
| @anthropic-ai/sdk | `npm i @anthropic-ai/sdk` | Claude API SDK |
| react-hook-form | `npm i react-hook-form` | Form management |
| zod | `npm i zod` | Schema validation |
| date-fns | `npm i date-fns` | Date utilities |
| zustand | `npm i zustand` | State management |
| lucide-react | `npm i lucide-react` | Icon library |

---

## 5. SHARED INFRASTRUCTURE & AUTH

### Firebase Project Setup
```
Project Name: reprieve-platform
Region: us-central1 (closest to Phoenix, AZ)

Enable:
- Authentication (Email/Password, Google, Phone, Anonymous)
- Cloud Firestore (production mode)
- Firebase Storage
- Cloud Functions
- Firebase Hosting
- Cloud Messaging (push notifications)
- App Check (abuse protection)
```

### Authentication Requirements
- **Email/Password** — primary for members
- **Phone Auth** — for users without email (homeless individuals)
- **Google Sign-In** — optional convenience
- **Anonymous Auth** — for My Struggle resource browsing without account
- **Custom Claims** — role-based access (member, mentor, case_manager, admin, super_admin)

### Role Hierarchy
```
super_admin → Full platform access, all lanes, all centers
admin → Single center admin, all lanes at their center
case_manager → Assigned members, Lane 1 + Lane 2 features
mentor → Assigned mentees, Lane 1 + Lane 3 features
member → Own data, all three lanes based on enrollment
anonymous → Lane 3 public resources only
```

### Security Rules Pattern
```javascript
// Firestore rules structure
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read/write own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth.token.role in ['admin', 'case_manager'];
    }
    
    // Lane-specific collections follow same pattern
    match /lane1/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /lane3_posts/{postId} {
      allow read: if true; // Public social feed
      allow write: if request.auth != null;
    }
  }
}
```

---

## 6. FIRESTORE DATA MODEL

### Users Collection
```typescript
interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: 'member' | 'mentor' | 'case_manager' | 'admin' | 'super_admin';
  lanes: ('lane1' | 'lane2' | 'lane3')[];  // Which lanes they're enrolled in
  centerId?: string;  // Which center they belong to
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  
  // Profile
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Timestamp;
    gender?: string;
    preferredLanguage: 'en' | 'es';
    bio?: string;
    sobrietyDate?: Timestamp;
    referralSource?: 'court' | 'prison' | 'self' | 'other_program' | 'walk_in';
  };
  
  // Lane 1 specific
  reentry?: {
    releaseDate?: Timestamp;
    facilityName?: string;
    paroleOfficer?: string;
    caseManagerId?: string;
    enrollmentStatus: 'intake' | 'active' | 'graduated' | 'inactive';
    graduationDate?: Timestamp;
  };
  
  // Lane 2 specific
  stepExperience?: {
    currentStep: number;  // 1-12
    enrollmentDate?: Timestamp;
    completionDate?: Timestamp;
  };
  
  // Lane 3 specific
  myStruggle?: {
    mentorId?: string;
    isMentor: boolean;
    joinDate?: Timestamp;
  };
  
  // Settings
  settings: {
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
      quietHoursStart?: string;  // "22:00"
      quietHoursEnd?: string;    // "07:00"
    };
    privacy: {
      profileVisible: boolean;
      showSobrietyDate: boolean;
      shareProgressWithMentor: boolean;
    };
  };
}
```

### Lane 1 Collections
```typescript
// /goals/{goalId}
interface Goal {
  id: string;
  userId: string;
  title: string;
  category: 'sobriety' | 'employment' | 'housing' | 'education' | 'health' | 'financial' | 'legal' | 'personal';
  status: 'active' | 'completed' | 'paused';
  targetDate?: Timestamp;
  progress: number;  // 0-100
  milestones: Milestone[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// /documents/{docId}
interface UserDocument {
  id: string;
  userId: string;
  category: 'id' | 'birth_certificate' | 'social_security' | 'court_papers' | 'diploma' | 'certification' | 'medical' | 'other';
  fileName: string;
  fileURL: string;  // Firebase Storage path
  expirationDate?: Timestamp;
  verified: boolean;
  verifiedBy?: string;
  uploadedAt: Timestamp;
}

// /action_plans/{planId}
interface ActionPlan {
  id: string;
  userId: string;
  title: string;
  columns: KanbanColumn[];
  createdBy: string;  // case_manager or member
  createdAt: Timestamp;
}

// /appointments/{appointmentId}
interface Appointment {
  id: string;
  userId: string;
  type: 'case_manager' | 'mentor' | 'therapy' | 'court' | 'parole' | 'medical' | 'interview' | 'aa_meeting' | 'other';
  title: string;
  dateTime: Timestamp;
  duration: number;  // minutes
  location?: string;
  virtualLink?: string;
  reminders: Timestamp[];
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
}

// /job_applications/{appId}
interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
  appliedDate?: Timestamp;
  notes: string;
  fairChanceEmployer: boolean;
}

// /budgets/{budgetId}
interface Budget {
  id: string;
  userId: string;
  month: string;  // "2026-02"
  income: BudgetItem[];
  expenses: BudgetItem[];
  savingsGoal: number;
}
```

### Lane 2 Collections
```typescript
// /courses/{courseId}
interface Course {
  id: string;
  title: string;
  description: string;
  stepNumber: number;  // 1-12
  order: number;
  modules: CourseModule[];
  totalDuration: number;  // minutes
  isPublished: boolean;
}

// /course_modules/{moduleId}
interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'reading' | 'assessment' | 'reflection' | 'discussion';
  content: {
    videoURL?: string;  // Mux or Firebase Storage
    text?: string;
    surveyJSON?: object;  // SurveyJS schema
  };
  duration: number;
  order: number;
}

// /user_progress/{progressId}
interface UserProgress {
  id: string;
  oduleId: string;
  userId: string;
  courseId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Timestamp;
  videoProgress?: number;  // seconds watched
  assessmentScore?: number;
  reflectionText?: string;
}

// /journal_entries/{entryId}
interface JournalEntry {
  id: string;
  userId: string;
  date: Timestamp;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'crisis';
  moodScore: number;  // 1-5
  content: string;  // Rich text
  tags: string[];
  isPrivate: boolean;
  sharedWith?: string[];  // userIds (therapist, mentor)
  relatedStep?: number;
  promptUsed?: string;
}

// /achievements/{achievementId}
interface Achievement {
  id: string;
  userId: string;
  type: 'sobriety_milestone' | 'step_completion' | 'course_completion' | 'streak' | 'community' | 'employment' | 'housing' | 'financial';
  title: string;
  description: string;
  icon: string;
  rank?: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: Timestamp;
  shared: boolean;  // Posted to social feed
}
```

### Lane 3 Collections
```typescript
// /posts/{postId}
interface Post {
  id: string;
  authorId: string;
  type: 'text' | 'image' | 'video' | 'story' | 'milestone' | 'resource_share';
  content: string;
  mediaURLs?: string[];
  likes: string[];  // userIds
  commentCount: number;
  isAnonymous: boolean;
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed';
  toxicityScore?: number;  // Perspective API
  createdAt: Timestamp;
}

// /comments/{commentId}
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: string[];
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed';
  createdAt: Timestamp;
}

// /resources/{resourceId}
interface Resource {
  id: string;
  name: string;
  type: 'shelter' | 'food' | 'medical' | 'mental_health' | 'legal' | 'employment' | 'transportation' | 'clothing' | 'showers' | 'phone_internet' | 'other';
  address: string;
  location: GeoPoint;
  phone?: string;
  website?: string;
  hours: string;
  description: string;
  services: string[];
  availability?: {
    beds?: { total: number; available: number; };
    walkIn: boolean;
  };
  lastVerified: Timestamp;
  verifiedBy: string;
  communityRating: number;
}

// /mentor_matches/{matchId}
interface MentorMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'proposed' | 'trial' | 'active' | 'ended';
  matchScore: number;  // AI-generated
  matchReason: string;
  startDate: Timestamp;
  feedbackScores: number[];
}

// /donations/{donationId}
interface Donation {
  id: string;
  donorId?: string;
  amount: number;
  currency: 'usd';
  campaignId?: string;
  stripePaymentId: string;
  status: 'pending' | 'completed' | 'refunded';
  isRecurring: boolean;
  createdAt: Timestamp;
}
```

### Shared Collections
```typescript
// /messages/{messageId}
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video_call_invite';
  readBy: string[];
  createdAt: Timestamp;
}

// /conversations/{conversationId}
interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  title?: string;  // For groups
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: { [userId: string]: number };
}

// /notifications/{notificationId}
interface AppNotification {
  id: string;
  userId: string;
  type: 'appointment_reminder' | 'message' | 'achievement' | 'milestone' | 'system' | 'job_match' | 'community';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

// /assessments/{assessmentId}  (SurveyJS responses)
interface Assessment {
  id: string;
  userId: string;
  surveyId: string;
  surveyJSON: object;  // SurveyJS schema
  responses: object;   // SurveyJS response data
  score?: number;
  completedAt: Timestamp;
}
```

---

## 7. LANE 1: RE-ENTRY PLATFORM — BUILD SPEC

### Features to Build
1. **Member Onboarding / Intake Flow**
   - Digital intake form (SurveyJS with conditional branching)
   - Referral source tracking
   - Document upload (court orders, treatment records)
   - Auto action plan generation
   - Case manager assignment

2. **Dashboard (Member View)**
   - Progress overview (goals, steps, employment, housing)
   - Upcoming appointments
   - Action plan (Kanban board)
   - Quick actions (check-in, message case manager, journal)
   - Achievements/milestones

3. **Document Vault**
   - Categorized file uploads (Firebase Storage)
   - Expiration tracking with reminders
   - Secure sharing with employers/housing/courts
   - Document request workflow

4. **Goal Tracking + Action Plans**
   - Custom goal creation with milestones
   - Kanban board for action items
   - Case manager collaboration
   - Template action plans ("First Week Out", "Job Search")
   - Progress visualization (Recharts)

5. **Resume Builder + Job Readiness**
   - Gap-friendly resume templates
   - AI resume coaching (Claude API)
   - Mock interview simulator
   - Skills inventory from LMS completion
   - Job application tracker

6. **Job Board**
   - Fair-chance employer listings
   - Search/filter by location, skills, type
   - Direct apply with resume attached
   - Employer partnership portal (admin feature)

7. **Appointment Scheduling**
   - Calendar view (react-big-calendar)
   - Book with case manager / mentor / therapist
   - Court date tracking with countdown
   - Automatic reminders (24hr, 1hr, 15min)
   - Virtual session links

8. **Video Calling**
   - 1:1 calls (mentor, case manager)
   - Group sessions (AA meetings, therapy)
   - Session scheduling integration
   - Call logging to member record

9. **Budget Tracker**
   - Income/expense tracking
   - "First 90 Days" template
   - Bill reminders
   - Financial goal setting
   - Visual charts

10. **Messaging**
    - Direct messages (member ↔ case manager, member ↔ mentor)
    - Group chats
    - File/image sharing
    - Read receipts
    - Push notifications

---

## 8. LANE 2: INTERACTIVE STEP EXPERIENCE — BUILD SPEC

### Features to Build
1. **Course Structure**
   - 12 steps, each a "course"
   - Modules within each course (video, reading, assessment, reflection)
   - Sequential unlocking (complete Step 1 to unlock Step 2)
   - Progress bar per course and overall

2. **Video Player**
   - ReactPlayer for Joe McDonald curriculum videos
   - Progress tracking (seconds watched, % complete)
   - Resume playback where left off
   - Playback speed controls
   - Video hosted on Mux or Firebase Storage

3. **Assessments & Quizzes**
   - SurveyJS for step assessments
   - Self-assessment questionnaires
   - Scored quizzes with passing thresholds
   - Results saved to Firestore
   - Analytics feed to admin dashboard

4. **Daily Wellness Check-in**
   - 30-second mood/sleep/cravings/energy form
   - Calendar heatmap visualization
   - Trend charts
   - AI-generated insights ("Your mood tends to dip on Mondays")
   - Risk flag for crisis patterns → alert case manager

5. **Journaling**
   - Rich text editor (TipTap)
   - Guided prompts tied to current step
   - Mood tagging per entry
   - Private by default, opt-in sharing
   - Gratitude journal feature
   - Trigger log
   - Export to PDF

6. **Gamification**
   - Recovery milestone badges (24hr, 7 days, 30, 90, 180, 365)
   - Step completion badges
   - Course completion certificates (PDF)
   - Engagement streaks
   - Animated celebrations (react-award / Lottie)
   - Shareable achievement cards to social feed

7. **Discussion Groups**
   - Per-step discussion forums
   - Moderated by staff
   - Peer support conversations
   - Connected to messaging system

---

## 9. LANE 3: MY STRUGGLE PLATFORM — BUILD SPEC

### Features to Build
1. **Social Feed**
   - Posts (text, image, video, milestone shares)
   - Comments, likes
   - Anonymous posting option
   - Content moderation (Perspective API + community flags + admin review)
   - Hashtag system

2. **Community Stories**
   - Written stories (TipTap rich text)
   - Video testimonials (MediaRecorder API + Firebase Storage)
   - Audio stories
   - Featured/curated stories
   - "Stories That Helped Me" bookmarks
   - Story prompts

3. **Mentor / Sponsor Matching**
   - Matching questionnaire (SurveyJS)
   - AI match scoring (Claude API)
   - 2-week trial period
   - Post-session feedback
   - Match quality tracking
   - Re-matching without stigma

4. **Resource Locator**
   - Google Maps integration
   - Categorized resources (shelter, food, medical, legal, etc.)
   - Real-time availability (bed counts, walk-in hours)
   - Proximity search + navigation
   - Community verification
   - Emergency resources (one-tap)
   - Provider self-update portal

5. **Donations**
   - One-time donations
   - Recurring sponsorships
   - Campaign-specific fundraising
   - Donor dashboard
   - Tax receipt generation (react-pdf)
   - Stripe Connect for disbursement

6. **Community Events**
   - Event creation/management
   - Calendar view
   - RSVP system
   - Virtual events (WebRTC rooms)
   - Event reminders
   - Attendance tracking

---

## 10. CROSS-CUTTING FEATURES — BUILD SPEC

### Notifications
- Firebase Cloud Messaging for push
- In-app notification center (bell icon)
- react-toastify for real-time toasts
- Email via SendGrid
- SMS via Twilio (optional)
- Quiet hours respect
- Per-type preferences (user controls what they receive)

### Multi-Language
- react-i18next for English + Spanish
- Language toggle in user settings
- All UI strings in translation files
- Content in both languages where possible

### Offline / PWA
- Workbox for service worker caching
- Firestore offline persistence (built-in)
- Offline access: resource directory, saved documents, journal, task board, emergency contacts
- Background sync on reconnect
- "Add to Home Screen" prompt

### Reporting & Exports
- Member outcome reports (PDF)
- Program analytics reports (PDF, Excel, CSV)
- Court compliance reports
- Funder reports (aggregate outcomes)
- Automated scheduled reports (Cloud Functions)

---

## 11. ADMIN DASHBOARD — BUILD SPEC

### Built with React-Admin + react-admin-firebase

### Views Required
1. **Member Management** — enrollment, status, demographics, search/filter
2. **Case Manager Workload** — assignments, caseload counts, activity
3. **Step Experience Analytics** — course completion rates, video engagement, assessment scores
4. **Employment Outcomes** — job placements, retention rates, wage growth
5. **Housing Outcomes** — housing secured, stability tracking
6. **Sobriety Metrics** — milestones, relapse tracking, wellness trends
7. **Community Moderation** — flagged content queue, user reports, actions taken
8. **Financial Overview** — donations, campaigns, disbursements
9. **Communication Logs** — messages, calls, appointment history
10. **Report Generator** — custom date ranges, export PDF/Excel/CSV

---

## 12. AI INTEGRATION — BUILD SPEC

### Claude API Configuration
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// System prompts for each AI persona
const AI_PERSONAS = {
  recoveryGuide: `You are a compassionate recovery guide for people in addiction recovery. 
    You understand the 12-step process, triggers, coping strategies, and the challenges of 
    early recovery. You never judge. You celebrate progress. You recognize crisis signals 
    and recommend professional help when needed. You have access to the user's current step, 
    sobriety date, and recent journal entries.`,
    
  lifeNavigator: `You are a practical life navigator helping people re-entering society after 
    incarceration. You know Arizona-specific resources, DMV processes, banking options for 
    people with no credit history, employment rights, housing resources, and legal aid options. 
    You give step-by-step actionable guidance.`,
    
  resourceFinder: `You are a resource finder for people experiencing homelessness or housing 
    insecurity in the Phoenix, AZ metropolitan area. You help locate shelters, food banks, 
    free clinics, legal aid, job training, and other services. You prioritize proximity and 
    current availability.`,
    
  resumeCoach: `You are an employment coach specializing in helping justice-involved individuals 
    build resumes and prepare for interviews. You know how to frame employment gaps positively, 
    highlight transferable skills, and identify fair-chance employers. You are encouraging but 
    realistic.`
};
```

### AI Features by Lane
| Lane | Feature | Trigger |
|------|---------|---------|
| Lane 1 | Resume coaching | User opens resume builder |
| Lane 1 | Life navigation Q&A | User asks question in AI chat |
| Lane 1 | Action plan suggestions | After intake assessment |
| Lane 1 | Job match analysis | New job posted matching profile |
| Lane 2 | Guided reflection prompts | User opens journal on current step |
| Lane 2 | Assessment review | After completing an assessment |
| Lane 2 | Crisis detection | Mood tracking detects risk pattern |
| Lane 3 | Resource recommendations | User searches for help |
| Lane 3 | Mentor matching | AI scores compatibility |
| Lane 3 | Story prompts | User starts writing a story |
| All | 24/7 support chat | User opens AI assistant |

---

## 13. PHASED BUILD TIMELINE

### Phase 1: Foundation (Weeks 1-4)
**Goal: Shared infrastructure, auth, data model, basic UI shell**
- [ ] Initialize monorepo (Turborepo)
- [ ] Set up Firebase project (Auth, Firestore, Storage, Functions, Hosting)
- [ ] Create shared package (components, hooks, services, types)
- [ ] Implement auth (email/password, phone, Google, roles)
- [ ] Define Firestore data model and security rules
- [ ] Set up Tailwind + shadcn/ui design system
- [ ] Create app shells for all 4 apps (Lane 1, 2, 3, Admin)
- [ ] Build shared navigation and routing
- [ ] Set up CI/CD (GitHub Actions → Firebase Hosting)

### Phase 2: Re-Entry MVP (Weeks 5-8)
**Goal: Core Lane 1 features for first member pilot**
- [ ] Member onboarding/intake flow (SurveyJS)
- [ ] Member dashboard
- [ ] Document vault (upload, categorize, expiration tracking)
- [ ] Goal tracking + action plan Kanban
- [ ] Messaging (direct + group, real-time Firestore)
- [ ] Appointment scheduling (react-big-calendar)
- [ ] Basic admin dashboard (React-Admin + member CRUD)
- [ ] Push notifications (FCM) for appointments
- [ ] Claude API integration (life navigator + support chat)

### Phase 3: Step Experience (Weeks 9-12)
**Goal: Full LMS with Joe McDonald curriculum**
- [ ] Course structure (12 steps, modules, sequential unlock)
- [ ] Video player integration (ReactPlayer + Mux/Storage)
- [ ] Upload and organize Joe McDonald video content
- [ ] Progress tracking (per-module, per-course, overall)
- [ ] Assessments (SurveyJS forms with scoring)
- [ ] Daily wellness check-in
- [ ] Journaling + mood tracking
- [ ] Gamification (milestone badges, step completion, streaks)
- [ ] Step-specific discussion groups
- [ ] Analytics feed to admin dashboard

### Phase 4: My Struggle (Weeks 13-16)
**Goal: Social platform with safety features**
- [ ] Social feed (posts, comments, likes, shares)
- [ ] Content moderation (Perspective API + flag system + admin queue)
- [ ] Community stories (written, video, audio)
- [ ] Mentor/sponsor matching (questionnaire + AI scoring)
- [ ] Resource locator (Google Maps + Firestore resources)
- [ ] Donation system (Stripe + campaigns)
- [ ] Community events calendar
- [ ] Anonymous posting option

### Phase 5: Employment & Life Tools (Weeks 17-20)
**Goal: Job readiness and financial stability features**
- [ ] Resume builder (fork career_portal)
- [ ] AI resume coaching (Claude API)
- [ ] Job board with fair-chance employer listings
- [ ] Job application tracker
- [ ] Mock interview simulator
- [ ] Financial literacy modules (LMS)
- [ ] Budget tracker
- [ ] Video calling (mooz fork for mentor/case manager sessions)

### Phase 6: Integration & Intelligence (Weeks 21-24)
**Goal: Cross-lane data flows, advanced AI, reporting**
- [ ] Cross-lane data flows (step completion → Lane 1 progress, achievements → social feed)
- [ ] Advanced AI agents (all four personas fully contextual)
- [ ] Full notification orchestration (push + in-app + email)
- [ ] Reporting engine (PDF + Excel + CSV exports)
- [ ] Automated report scheduling (Cloud Functions)
- [ ] Multi-language (Spanish)
- [ ] Referral/intake system for new centers

### Phase 7: Mobile & Scale (Weeks 25-28)
**Goal: Mobile apps, offline, performance, beta**
- [ ] PWA optimization (Workbox offline caching)
- [ ] Capacitor mobile wrapper (iOS + Android)
- [ ] Offline mode for critical features
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Load testing
- [ ] Beta testing with real REPrieve members
- [ ] Feedback collection + iteration
- [ ] Documentation for new center onboarding

---

## 14. DEPLOYMENT & INFRASTRUCTURE

### Environments
```
Development:  localhost (Vite dev server + Firebase emulators)
Staging:      staging-newfreedom.web.app (Firebase Hosting)
Production:   app.newfreedomaz.com (Firebase Hosting + custom domain)
```

### CI/CD Pipeline
```yaml
# GitHub Actions
on push to main:
  1. Run TypeScript type check
  2. Run ESLint
  3. Run tests (Vitest)
  4. Build all packages
  5. Deploy to Firebase Hosting (staging)

on release tag:
  1. All above +
  2. Deploy to production
  3. Deploy Cloud Functions
  4. Update Firestore rules
```

---

## 15. COST PROJECTIONS

### At Launch (0-100 users)
| Service | Monthly |
|---------|---------|
| Firebase (Spark → Blaze) | $0-25 |
| Claude API | $20-50 |
| Mux | $0-20 |
| Everything else | Free tier |
| **TOTAL** | **$20-95/mo** |

### At Scale (500 users)
| Service | Monthly |
|---------|---------|
| Firebase | $50-150 |
| Claude API | $100-200 |
| Mux | $20-50 |
| Google Maps | $0-25 |
| SendGrid | $15 |
| Search (Algolia/Typesense) | $0-35 |
| Vercel | $20 |
| **TOTAL** | **$205-495/mo** |

### Revenue Offsets
- Donations via Stripe (My Struggle)
- Grant funding (outcome data from platform)
- Per-center licensing (when expanding to other organizations)

---

## 16. CLAUDE CODE SESSION INSTRUCTIONS

### How to Use This Document with Claude Code

**Step 1: Connect to repo**
```bash
# Clone or navigate to your existing repo
cd /path/to/reprieve-platform

# Copy this document to the repo root
cp MASTER_BUILD_PLAN.md ./

# Start Claude Code
claude
```

**Step 2: Initial assessment prompt**
```
Read MASTER_BUILD_PLAN.md in the repo root. This is the complete build specification 
for a three-lane digital platform. Assess the current state of the codebase against 
this plan. Tell me:
1. What exists already
2. What's missing
3. Recommended next steps
4. Any architecture concerns
```

**Step 3: Phase-by-phase build prompts**
```
We're starting Phase 1 (Foundation). Following the MASTER_BUILD_PLAN.md spec:
1. Initialize the monorepo with Turborepo
2. Set up the shared package with Firebase config
3. Implement the auth system with role-based access
4. Create the Firestore data model
5. Build the app shells for all 4 apps
```

**Step 4: Feature-by-feature prompts**
```
Build the Document Vault feature for Lane 1. Requirements from MASTER_BUILD_PLAN.md:
- Categorized file uploads to Firebase Storage
- Categories: ID, Birth Certificate, Social Security, Court Papers, etc.
- Expiration tracking with auto-reminders
- Secure sharing with employers/housing/courts
- Document request workflow (case manager requests → member uploads)
- Role-based access (member sees own, case manager sees assigned)
```

### Claude Code Best Practices for This Project
- Always reference MASTER_BUILD_PLAN.md for architecture decisions
- Follow the TypeScript interfaces defined in Section 6 for all Firestore operations
- Use shared package for all cross-lane components
- Test with Firebase emulators locally before deploying
- Commit after each feature is complete and tested
- Use conventional commits (feat:, fix:, docs:, refactor:)

---

*Document Version: 1.0*
*Created: February 20, 2026*
*Last Updated: February 20, 2026*
*Author: Brian (ManageAI) + Claude*
