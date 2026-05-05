import React from 'react';

export type OfficeRole = 'admin' | 'lawyer' | 'secretary' | 'viewer';

export type OfficeMembership = {
  office_id: string;
  office_name: string;
  role: OfficeRole;
};

export type SessionState = {
  user: any | null;
  memberships: OfficeMembership[];
  activeOfficeId: string | null;
  activeRole: OfficeRole | null;
  setActiveOffice: (officeId: string) => void;
  refreshMemberships: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const SessionContext = React.createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider/>');
  return ctx;
}
