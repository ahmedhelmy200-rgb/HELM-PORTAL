import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { SessionContext, type OfficeMembership, type OfficeRole } from '../services/session';

type Props = { children: React.ReactNode };

function mapPortalRole(role?: string | null): OfficeRole {
  if (role === 'admin') return 'admin';
  if (role === 'lawyer' || role === 'staff') return 'lawyer';
  if (role === 'assistant' || role === 'secretary') return 'secretary';
  return 'viewer';
}

export default function SessionProvider({ children }: Props) {
  const { user, logout, appPublicSettings } = useAuth();
  const activeRole = user ? mapPortalRole(user.role) : null;
  const activeOfficeId = user ? 'portal-main' : null;

  const memberships: OfficeMembership[] = user ? [{
    office_id: 'portal-main',
    office_name: appPublicSettings?.office_name || 'HELM Portal',
    role: activeRole || 'viewer',
  }] : [];

  const setActiveOffice = React.useCallback((_officeId: string) => {
    // النسخة الموحدة تعمل على نفس مكتب Portal الحالي؛ لا توجد مكاتب منفصلة داخل Smart.
  }, []);

  const refreshMemberships = React.useCallback(async () => {
    // مصدر الحقيقة هو AuthContext في Portal، لذلك لا نقرأ v_my_offices ولا bootstrap منفصل.
  }, []);

  const signOut = React.useCallback(async () => {
    await logout(false);
  }, [logout]);

  return (
    <SessionContext.Provider value={{
      user,
      memberships,
      activeOfficeId,
      activeRole,
      setActiveOffice,
      refreshMemberships,
      signOut,
    }}>
      {children}
    </SessionContext.Provider>
  );
}
