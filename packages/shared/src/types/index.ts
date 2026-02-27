import { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'member' | 'mentor' | 'case_manager' | 'admin' | 'super_admin';
export type Lane = 'lane1' | 'lane2' | 'lane3';

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Timestamp;
  gender?: string;
  city?: string;
  state?: string;
  preferredLanguage: 'en' | 'es';
  bio?: string;
  sobrietyDate?: Timestamp;
  referralSource?: 'court' | 'prison' | 'self' | 'other_program' | 'walk_in';
}

export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  privacy: {
    profileVisible: boolean;
    showSobrietyDate: boolean;
    shareProgressWithMentor: boolean;
  };
}

export interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  lanes: Lane[];
  centerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  profile: UserProfile;
  reentry?: {
    releaseDate?: Timestamp;
    facilityName?: string;
    paroleOfficer?: string;
    caseManagerId?: string;
    enrollmentStatus: 'intake' | 'active' | 'graduated' | 'inactive';
    graduationDate?: Timestamp;
  };
  stepExperience?: {
    currentStep: number;
    enrollmentDate?: Timestamp;
    completionDate?: Timestamp;
  };
  myStruggle?: {
    mentorId?: string;
    isMentor: boolean;
    joinDate?: Timestamp;
  };
  settings: UserSettings;
}

// Lane 1 types
export type GoalCategory = 'sobriety' | 'employment' | 'housing' | 'education' | 'health' | 'financial' | 'legal' | 'personal';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Timestamp;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  status: 'active' | 'completed' | 'paused';
  targetDate?: Timestamp;
  progress: number;
  milestones: Milestone[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DocumentCategory = 'id' | 'birth_certificate' | 'social_security' | 'court_papers' | 'diploma' | 'certification' | 'medical' | 'other';

export interface UserDocument {
  id: string;
  userId: string;
  category: DocumentCategory;
  fileName: string;
  fileURL: string;
  expirationDate?: Timestamp;
  verified: boolean;
  verifiedBy?: string;
  uploadedAt: Timestamp;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface ActionPlan {
  id: string;
  userId: string;
  title: string;
  columns: KanbanColumn[];
  createdBy: string;
  createdAt: Timestamp;
}

export type AppointmentType = 'case_manager' | 'mentor' | 'therapy' | 'court' | 'parole' | 'medical' | 'interview' | 'aa_meeting' | 'other';

export interface Appointment {
  id: string;
  userId: string;
  type: AppointmentType;
  title: string;
  dateTime: Timestamp;
  duration: number;
  location?: string;
  virtualLink?: string;
  reminders: Timestamp[];
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
}

export type JobApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  status: JobApplicationStatus;
  appliedDate?: Timestamp;
  notes: string;
  fairChanceEmployer: boolean;
}

export interface BudgetItem {
  id: string;
  label: string;
  amount: number;
  category: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  income: BudgetItem[];
  expenses: BudgetItem[];
  savingsGoal: number;
}

// Lane 2 types
export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'reading' | 'assessment' | 'reflection' | 'discussion';
  content: {
    videoURL?: string;
    text?: string;
    surveyJSON?: object;
  };
  duration: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  stepNumber: number;
  order: number;
  modules: CourseModule[];
  totalDuration: number;
  isPublished: boolean;
}

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Timestamp;
  videoProgress?: number;
  assessmentScore?: number;
  reflectionText?: string;
}

export type MoodLevel = 'great' | 'good' | 'okay' | 'struggling' | 'crisis';

export interface JournalEntry {
  id: string;
  userId: string;
  date: Timestamp;
  mood: MoodLevel;
  moodScore: number;
  content: string;
  tags: string[];
  isPrivate: boolean;
  sharedWith?: string[];
  relatedStep?: number;
  promptUsed?: string;
}

export type AchievementType = 'sobriety_milestone' | 'step_completion' | 'course_completion' | 'streak' | 'community' | 'employment' | 'housing' | 'financial';

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  rank?: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: Timestamp;
  shared: boolean;
}

// Lane 3 types
export type PostType = 'text' | 'image' | 'video' | 'story' | 'milestone' | 'resource_share';
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'removed';

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content: string;
  mediaURLs?: string[];
  likes: string[];
  commentCount: number;
  isAnonymous: boolean;
  moderationStatus: ModerationStatus;
  toxicityScore?: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: string[];
  moderationStatus: ModerationStatus;
  createdAt: Timestamp;
}

export type ResourceType = 'shelter' | 'food' | 'medical' | 'mental_health' | 'legal' | 'employment' | 'transportation' | 'clothing' | 'showers' | 'phone_internet' | 'other';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  address: string;
  location: { latitude: number; longitude: number };
  phone?: string;
  website?: string;
  hours: string;
  description: string;
  services: string[];
  availability?: {
    beds?: { total: number; available: number };
    walkIn: boolean;
  };
  lastVerified: Timestamp;
  verifiedBy: string;
  communityRating: number;
}

export interface MentorMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'proposed' | 'trial' | 'active' | 'ended';
  matchScore: number;
  matchReason: string;
  startDate: Timestamp;
  feedbackScores: number[];
}

export interface Donation {
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

// Shared types
export type MessageType = 'text' | 'image' | 'file' | 'video_call_invite';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readBy: string[];
  createdAt: Timestamp;
  attachmentURL?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'document';
}

export interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group';
  title?: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: Record<string, number>;
}

export type NotificationType = 'appointment_reminder' | 'message' | 'achievement' | 'milestone' | 'system' | 'job_match' | 'community';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface Assessment {
  id: string;
  userId: string;
  surveyId: string;
  surveyJSON: object;
  responses: object;
  score?: number;
  completedAt: Timestamp;
}
