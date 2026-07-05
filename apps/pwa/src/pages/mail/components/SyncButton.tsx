type Props = { onSync: () => void; syncing: boolean; lastSyncedAt: Date | null };

export function SyncButton({ onSync, syncing, lastSyncedAt }: Props) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      title={lastSyncedAt ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}` : 'Click to sync'}
      style={{
        background: 'none', border: '1px solid #e5e7eb', borderRadius: 6,
        padding: '4px 12px', cursor: syncing ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151',
      }}
    >
      <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none', fontSize: 15 }}>↻</span>
      {syncing ? 'Syncing…' : 'Refresh'}
    </button>
  );
}
