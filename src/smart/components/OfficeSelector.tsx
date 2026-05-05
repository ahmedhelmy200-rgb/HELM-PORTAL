import React from 'react';
import { useSession } from '../services/session';

export default function OfficeSelector() {
  const { memberships, activeOfficeId, setActiveOffice } = useSession();

  if (memberships.length <= 1) return null;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ opacity: 0.85, fontSize: 12 }}>المكتب:</div>
      <select
        value={activeOfficeId ?? ''}
        onChange={(e) => setActiveOffice(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'inherit', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {memberships.map(m => (
          <option key={m.office_id} value={m.office_id}>
            {m.office_name}
          </option>
        ))}
      </select>
    </div>
  );
}
