'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import {
  clearPendingProfileBootstrap,
  readPendingProfileBootstrap,
} from '@/lib/profile-bootstrap';

const apiBase = '/api/profile';

export default function ProfileBootstrapSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasAttemptedRef.current) {
      return;
    }

    const pendingProfile = readPendingProfileBootstrap();

    if (!pendingProfile) {
      hasAttemptedRef.current = true;
      return;
    }

    hasAttemptedRef.current = true;

    void (async () => {
      try {
        const token = await getToken();

        if (!token) {
          hasAttemptedRef.current = false;
          return;
        }

        const response = await fetch(`${apiBase}/my-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-user-email': user.primaryEmailAddress?.emailAddress || pendingProfile.email,
            'x-user-name': user.fullName || user.username || `${pendingProfile.firstName} ${pendingProfile.lastName}`.trim(),
          },
          body: JSON.stringify(pendingProfile),
        });

        const body = (await response.json()) as { success?: boolean };

        if (!response.ok || !body.success) {
          hasAttemptedRef.current = false;
          return;
        }

        clearPendingProfileBootstrap();
      } catch {
        hasAttemptedRef.current = false;
      }
    })();
  }, [getToken, isLoaded, user]);

  return null;
}
