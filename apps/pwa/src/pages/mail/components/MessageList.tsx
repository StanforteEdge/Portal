import { useMailHeaders } from '../hooks/useMailHeaders';
import type { MailHeader } from '@stanforte/shared';

type Props = {
  accountId: string | null;
  folder: string;
  selectedUid: string | null;
  onSelect: (header: MailHeader) => void;
  onRefreshed?: () => void;
};

export function MessageList({ accountId, folder, selectedUid, onSelect }: Props) {
  const { headers, loading, loadMore, hasMore } = useMailHeaders(accountId, folder);

  if (!accountId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        Select an account
      </div>
    );
  }

  return (
    <div style={{ width: 300, borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {loading && headers.length === 0 && (
        <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading…</div>
      )}

      {!loading && headers.length === 0 && (
        <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No messages in this folder.</div>
      )}

      {headers.map(h => (
        <div
          key={h.uid}
          onClick={() => onSelect(h)}
          style={{
            padding: '12px 14px',
            cursor: 'pointer',
            borderBottom: '1px solid #f3f4f6',
            background: selectedUid === h.uid ? '#eff6ff' : h.isRead ? '#fff' : '#f9fafb',
            fontWeight: h.isRead ? 400 : 600,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%', color: '#111827' }}>
              {h.fromName ?? h.fromEmail ?? '(unknown)'}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
              {h.date ? new Date(h.date).toLocaleDateString() : ''}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {h.subject ?? '(no subject)'}
          </div>
          {h.snippet && (
            <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {h.snippet}
            </div>
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          style={{ margin: 12, padding: '7px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 12, color: '#374151' }}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
