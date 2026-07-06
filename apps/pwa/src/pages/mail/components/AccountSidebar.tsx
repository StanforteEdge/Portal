import { useState } from 'react';
import type { MailAccount } from '@stanforte/shared';

const GOOGLE_FOLDERS = ['INBOX', '[Gmail]/Sent Mail', '[Gmail]/Drafts', '[Gmail]/Spam', '[Gmail]/Trash'];
const MICROSOFT_FOLDERS = ['INBOX', 'Sent Items', 'Drafts', 'Junk Email', 'Deleted Items'];
const FOLDER_LABELS: Record<string, string> = {
  'INBOX': 'Inbox',
  '[Gmail]/Sent Mail': 'Sent',
  '[Gmail]/Drafts': 'Drafts',
  '[Gmail]/Spam': 'Spam',
  '[Gmail]/Trash': 'Trash',
  'Sent Items': 'Sent',
  'Junk Email': 'Junk',
  'Deleted Items': 'Trash',
  'Drafts': 'Drafts',
};

type Props = {
  accounts: MailAccount[];
  selectedAccountId: string | 'all';
  selectedFolder: string;
  onSelectAccount: (id: string | 'all') => void;
  onSelectFolder: (folder: string) => void;
  onDisconnect: (id: string) => void;
  onAddGoogle: () => void;
  onAddMicrosoft: () => void;
};

export function AccountSidebar({
  accounts, selectedAccountId, selectedFolder,
  onSelectAccount, onSelectFolder, onDisconnect,
  onAddGoogle, onAddMicrosoft,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const folders = selectedAccountId === 'all' || !selectedAccount
    ? ['INBOX']
    : selectedAccount.provider === 'GOOGLE' ? GOOGLE_FOLDERS : MICROSOFT_FOLDERS;

  return (
    <aside style={{ width: 220, borderRight: '1px solid #e5e7eb', height: '100%', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
      <div style={{ padding: '12px 12px 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Accounts
      </div>

      <div
        onClick={() => onSelectAccount('all')}
        style={{
          padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: selectedAccountId === 'all' ? '#eff6ff' : 'transparent',
          color: selectedAccountId === 'all' ? '#1d4ed8' : '#111827',
        }}
      >
        All Accounts
      </div>

      {accounts.map(a => (
        <div
          key={a.id}
          onClick={() => onSelectAccount(a.id)}
          style={{
            padding: '8px 16px', cursor: 'pointer', fontSize: 13,
            background: selectedAccountId === a.id ? '#eff6ff' : 'transparent',
            color: selectedAccountId === a.id ? '#1d4ed8' : '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.label ?? a.emailAddress}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDisconnect(a.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 12, flexShrink: 0, padding: '0 2px' }}
            title="Disconnect account"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add account */}
      <div style={{ padding: '6px 12px', position: 'relative' }}>
        <button
          onClick={() => setShowAddMenu(v => !v)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}
        >
          + Add account
        </button>
        {showAddMenu && (
          <div style={{ position: 'absolute', top: '100%', left: 12, right: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
            <button
              onClick={() => { setShowAddMenu(false); onAddGoogle(); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Google (Gmail)
            </button>
            <button
              onClick={() => { setShowAddMenu(false); onAddMicrosoft(); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}
            >
              <svg width="16" height="16" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
              Microsoft (Outlook)
            </button>
          </div>
        )}
      </div>

      </div>{/* end flex: 1 */}

      <div style={{ padding: '16px 12px 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid #f3f4f6', marginTop: 8 }}>
        Folders
      </div>

      {folders.map(f => (
        <div
          key={f}
          onClick={() => onSelectFolder(f)}
          style={{
            padding: '6px 16px', cursor: 'pointer', fontSize: 13,
            background: selectedFolder === f ? '#eff6ff' : 'transparent',
            color: selectedFolder === f ? '#1d4ed8' : '#374151',
          }}
        >
          {FOLDER_LABELS[f] ?? f}
        </div>
      ))}
    </aside>
  );
}
