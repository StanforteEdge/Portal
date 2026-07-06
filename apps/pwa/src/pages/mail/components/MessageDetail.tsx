import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useMailBody } from '../hooks/useMailBody';
import { mailApi } from '@/shared/lib/core';
import type { MailHeader } from '@stanforte/shared';

type Props = {
  accountId: string;
  header: MailHeader;
  onReply: () => void;
  onForward: () => void;
  onDeleted?: () => void;
  onToggleRead?: (isRead: boolean) => void;
  onBack?: () => void;
};

export function MessageDetail({ accountId, header, onReply, onForward, onDeleted, onToggleRead, onBack }: Props) {
  const { html, text, loading } = useMailBody(accountId, header.uid, header.folder);
  const [actionLoading, setActionLoading] = useState(false);

  const safeHtml = html
    ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
    : text
      ? `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`
      : '';

  const handleToggleRead = async () => {
    setActionLoading(true);
    try {
      const nextRead = !header.isRead;
      await mailApi.markRead(accountId, header.uid, header.folder, nextRead);
      onToggleRead?.(nextRead);
    } catch (err) {
      console.error('Failed to toggle read state', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrash = async () => {
    if (!window.confirm('Are you sure you want to move this message to Trash?')) return;
    setActionLoading(true);
    try {
      await mailApi.trashMessage(accountId, header.uid, header.folder);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to trash message', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
      {/* Top Action Bar (MacBook Mail Style) */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'center', background: '#f9fafb' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden"
            style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500 }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={onReply}
          disabled={actionLoading}
          style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>↩</span> Reply
        </button>
        <button
          onClick={onForward}
          disabled={actionLoading}
          style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>↪</span> Forward
        </button>
        <button
          onClick={handleToggleRead}
          disabled={actionLoading}
          style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500 }}
        >
          {header.isRead ? '📖 Mark Unread' : '✉ Mark Read'}
        </button>
        <button
          onClick={handleTrash}
          disabled={actionLoading}
          style={{ padding: '6px 14px', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500, marginLeft: 'auto' }}
        >
          🗑 Delete
        </button>
      </div>

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

        {loading ? (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading message…</div>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: safeHtml }}
            style={{ fontSize: 14, lineHeight: 1.7, color: '#111827' }}
          />
        )}
      </div>
    </div>
  );
}
