import { useState, useCallback } from 'react';
import { AccountSidebar } from './components/AccountSidebar';
import { MessageList } from './components/MessageList';
import { MessageDetail } from './components/MessageDetail';
import { ComposeModal } from './components/ComposeModal';
import { AccountConnectPrompt } from './components/AccountConnectPrompt';
import { SyncButton } from './components/SyncButton';
import { useMailAccounts } from './hooks/useMailAccounts';
import { useMailSync } from './hooks/useMailSync';
import type { MailHeader } from '@stanforte/shared';

export function MailLayout() {
  const { accounts, loading, connectGoogle, connectMicrosoft, disconnect } = useMailAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [selectedHeader, setSelectedHeader] = useState<MailHeader | null>(null);
  const [compose, setCompose] = useState<{ mode: 'compose' | 'reply' | 'forward'; header?: MailHeader } | null>(null);

  const handleSyncComplete = useCallback(() => {
    // Headers will reload on next render via useMailHeaders
  }, []);

  const { sync, syncing, lastSyncedAt } = useMailSync(accounts, handleSyncComplete);

  // Trigger sync on first account load
  const [hasSynced, setHasSynced] = useState(false);
  if (!loading && accounts.length > 0 && !hasSynced) {
    setHasSynced(true);
    void sync();
  }

  const activeAccountId: string | null = selectedAccountId === 'all'
    ? (accounts[0]?.id ?? null)
    : selectedAccountId;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>Loading…</div>;
  }

  if (accounts.length === 0) {
    return <AccountConnectPrompt onConnectGoogle={connectGoogle} onConnectMicrosoft={connectMicrosoft} />;
  }

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', fontFamily: 'Segoe UI, Arial, sans-serif', overflow: 'hidden', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
      <AccountSidebar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        selectedFolder={selectedFolder}
        onSelectAccount={id => { setSelectedAccountId(id); setSelectedHeader(null); }}
        onSelectFolder={f => { setSelectedFolder(f); setSelectedHeader(null); }}
        onDisconnect={disconnect}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setCompose({ mode: 'compose' })}
            style={{ padding: '6px 18px', background: '#034785', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            + Compose
          </button>
          <SyncButton onSync={sync} syncing={syncing} lastSyncedAt={lastSyncedAt} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <MessageList
            accountId={activeAccountId}
            folder={selectedFolder}
            selectedUid={selectedHeader?.uid ?? null}
            onSelect={h => {
              setSelectedHeader(h);
            }}
          />

          {selectedHeader && activeAccountId ? (
            <MessageDetail
              accountId={activeAccountId}
              header={selectedHeader}
              onReply={() => setCompose({ mode: 'reply', header: selectedHeader })}
              onForward={() => setCompose({ mode: 'forward', header: selectedHeader })}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {compose && activeAccountId && (
        <ComposeModal
          accountId={activeAccountId}
          mode={compose.mode}
          originalHeader={compose.header}
          onClose={() => setCompose(null)}
          onSent={() => setCompose(null)}
        />
      )}
    </div>
  );
}
