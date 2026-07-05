import DOMPurify from 'dompurify';
import { useMailBody } from '../hooks/useMailBody';
import type { MailHeader } from '@stanforte/shared';

type Props = {
  accountId: string;
  header: MailHeader;
  onReply: () => void;
  onForward: () => void;
};

export function MessageDetail({ accountId, header, onReply, onForward }: Props) {
  const { html, loading } = useMailBody(accountId, header.uid, header.folder);
  const safeHtml = html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : '';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          {header.subject ?? '(no subject)'}
        </h2>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>
          From: {header.fromName ? `${header.fromName} <${header.fromEmail}>` : (header.fromEmail ?? 'Unknown')}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Date: {header.date ? new Date(header.date).toLocaleString() : '—'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={onReply}
          style={{ padding: '6px 18px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff', fontWeight: 600, fontSize: 13 }}
        >
          ↩ Reply
        </button>
        <button
          onClick={onForward}
          style={{ padding: '6px 18px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 }}
        >
          ↪ Forward
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading message…</div>
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: safeHtml }}
          style={{ fontSize: 14, lineHeight: 1.7, color: '#111827' }}
        />
      )}
    </div>
  );
}
