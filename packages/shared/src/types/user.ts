import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth?: Timestamp;
  readonly gender?: string;
  readonly preferredLanguage: 'en' | 'es';
  readonly bio?: string;
  readonly sobrietyDate?: Timestamp;
  readonly referralSource?: 'court' | 'prison' | 'self' | 'other_program' | 'walk_in';
}

export interface UserSettings {
  readonly notifications: {
    readonly push: boolean;
    readonly email: boolean;
    readonly sms: boolean;
    readonly quietHoursStart?: string;
    readonly quietHoursEnd?: string;
  };
  readonly privacy: {
    readonly profileVisible: boolean;
    readonly showSobrietyDate: boolean;
    readonly shareProgressWithMentor: boolean;
  };
}

export type UserRole = 'member' | 'mentor' | 'case_manager' | 'admin' | 'super_admin';
export type Lane = 'lane1' | 'lane2' | 'lane3';

export interface User {
  readonly uid: string;
  readonly email: string;
  readonly phone?: string;
  readonly displayName: string;
  readonly photoURL?: string;
  readonly role: UserRole;
  readonly lanes: readonly Lane[];
  readonly centerId?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly lastLoginAt: Timestamp;
  readonly profile: UserProfile;
  readonly myStruggle?: {
    readonly mentorId?: string;
    readonly isMentor: boolean;
    readonly joinDate?: Timestamp;
  };
  readonly settings: UserSettings;
}
