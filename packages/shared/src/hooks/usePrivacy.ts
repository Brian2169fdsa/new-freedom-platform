/**
 * usePrivacy — React hook for GDPR-compliant privacy management.
 *
 * Provides access to privacy settings, data export, and account deletion
 * via Firebase callable functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { callFunction } from '../services/firebase/functions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileVisibility = 'public' | 'connections' | 'private';
export type AllowMessages = 'everyone' | 'connections' | 'none';
export type DataRetentionDays = 90 | 180 | 365 | -1;

export interface PrivacySettings {
  readonly profileVisibility: ProfileVisibility;
  readonly showSobrietyDate: boolean;
  readonly showActivityStatus: boolean;
  readonly allowMessages: AllowMessages;
  readonly dataRetentionDays: DataRetentionDays;
}

export interface PrivacySettingsUpdate {
  readonly profileVisibility?: ProfileVisibility;
  readonly showSobrietyDate?: boolean;
  readonly showActivityStatus?: boolean;
  readonly allowMessages?: AllowMessages;
  readonly dataRetentionDays?: DataRetentionDays;
}

interface ExportDataResponse {
  readonly exportMetadata: {
    readonly exportedAt: string;
    readonly userId: string;
    readonly platform: string;
    readonly dataCategories: readonly string[];
  };
  readonly userProfile: Record<string, unknown> | null;
  readonly privacySettings: PrivacySettings;
  readonly [collection: string]: unknown;
}

interface DeleteAccountResponse {
  readonly success: boolean;
  readonly deletedCollections: readonly string[];
  readonly totalDocumentsDeleted: number;
}

interface UpdateSettingsResponse {
  readonly success: boolean;
  readonly settings: PrivacySettings;
}

export interface UsePrivacyResult {
  readonly settings: PrivacySettings | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly updateSettings: (updates: PrivacySettingsUpdate) => Promise<void>;
  readonly exportData: () => Promise<void>;
  readonly deleteAccount: (confirmationText: string) => Promise<DeleteAccountResponse>;
}

// ---------------------------------------------------------------------------
// Callable function references
// ---------------------------------------------------------------------------

const getPrivacySettingsFn = callFunction<void, PrivacySettings>(
  'getPrivacySettings'
);

const updatePrivacySettingsFn = callFunction<
  PrivacySettingsUpdate,
  UpdateSettingsResponse
>('updatePrivacySettings');

const exportUserDataFn = callFunction<void, ExportDataResponse>(
  'exportUserData'
);

const deleteAllUserDataFn = callFunction<
  { confirmationText: string },
  DeleteAccountResponse
>('deleteAllUserData');

// ---------------------------------------------------------------------------
// Default settings (used before server response arrives)
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: PrivacySettings = {
  profileVisibility: 'connections',
  showSobrietyDate: false,
  showActivityStatus: true,
  allowMessages: 'connections',
  dataRetentionDays: -1,
};

// ---------------------------------------------------------------------------
// Helper: download JSON to browser
// ---------------------------------------------------------------------------

function downloadJsonFile(
  data: unknown,
  filename: string,
): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrivacy(): UsePrivacyResult {
  const { firebaseUser } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch privacy settings when user is authenticated
  useEffect(() => {
    if (!firebaseUser) {
      setSettings(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPrivacySettingsFn();
        if (!cancelled) {
          setSettings(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error
            ? err.message
            : 'Failed to load privacy settings.';
          setError(message);
          // Fall back to defaults so the UI is still functional
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  /**
   * Update one or more privacy settings fields.
   * Optimistically updates local state then syncs with server.
   */
  const updateSettings = useCallback(
    async (updates: PrivacySettingsUpdate): Promise<void> => {
      if (!firebaseUser) {
        throw new Error('You must be signed in to update privacy settings.');
      }

      // Validate at least one field is provided
      const hasUpdates = Object.values(updates).some((v) => v !== undefined);
      if (!hasUpdates) {
        return;
      }

      // Optimistic update — merge with current settings
      const previousSettings = settings;
      const optimisticSettings: PrivacySettings = {
        ...(settings ?? DEFAULT_SETTINGS),
        ...Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        ),
      } as PrivacySettings;
      setSettings(optimisticSettings);
      setError(null);

      try {
        const result = await updatePrivacySettingsFn(updates);
        setSettings(result.data.settings);
      } catch (err) {
        // Revert optimistic update on failure
        setSettings(previousSettings);
        const message = err instanceof Error
          ? err.message
          : 'Failed to update privacy settings.';
        setError(message);
        throw new Error(message);
      }
    },
    [firebaseUser, settings]
  );

  /**
   * Export all user data as a JSON file download.
   */
  const exportData = useCallback(async (): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('You must be signed in to export your data.');
    }

    setError(null);

    try {
      const result = await exportUserDataFn();
      const exportPayload = result.data;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `new-freedom-data-export-${timestamp}.json`;

      downloadJsonFile(exportPayload, filename);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to export data. You may only export once every 24 hours.';
      setError(message);
      throw new Error(message);
    }
  }, [firebaseUser]);

  /**
   * Permanently delete all user data and the user account.
   * Requires exact confirmation text: "DELETE ALL MY DATA"
   */
  const deleteAccount = useCallback(
    async (confirmationText: string): Promise<DeleteAccountResponse> => {
      if (!firebaseUser) {
        throw new Error('You must be signed in to delete your account.');
      }

      if (confirmationText !== 'DELETE ALL MY DATA') {
        throw new Error(
          'You must type "DELETE ALL MY DATA" exactly to confirm account deletion.'
        );
      }

      setError(null);

      try {
        const result = await deleteAllUserDataFn({ confirmationText });
        return result.data;
      } catch (err) {
        const message = err instanceof Error
          ? err.message
          : 'Failed to delete account. Please contact support.';
        setError(message);
        throw new Error(message);
      }
    },
    [firebaseUser]
  );

  return {
    settings,
    loading,
    error,
    updateSettings,
    exportData,
    deleteAccount,
  };
}
