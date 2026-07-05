# Webmail Inbox Client — Design Spec
**Date:** 2026-07-05  
**Status:** Approved  
**Scope:** MVP — Read + Compose (Phase 1)

---

## 1. Overview

Embed a full business webmail inbox client directly in the portal PWA. Staff connect their Google Workspace or Microsoft 365 accounts via OAuth. Email is fetched via IMAP (XOAUTH2), sent via SMTP (XOAUTH2), and headers are cached in PostgreSQL for fast loads. Email bodies are cached locally in IndexedDB (browser-side only — never on the server).

**Out of scope for Phase 1:** push notifications (Gmail Pub/Sub / Graph webhooks), folder management (create/rename/delete), attachment upload, full-text body search, mobile push.

**Phase 2 additions (not designed here):** real-time push via webhooks, IMAP IDLE connection, attachment management, body-level search.

---

## 2. Supported Providers

| Provider | Auth | Read | Send |
|---|---|---|---|
| Google Workspace | OAuth 2.0 | IMAP + XOAUTH2 | SMTP + XOAUTH2 |
| Microsoft 365 | OAuth 2.0 | IMAP + XOAUTH2 | SMTP + XOAUTH2 |

Generic IMAP/SMTP (non-OAuth) is explicitly excluded from Phase 1.

---

## 3. Access Model

- Available to **all authenticated staff** (no role restriction)
- Each user opts in by connecting their own account via OAuth consent screen
- Users with shared mailboxes connect them as additional accounts (multiple `MailAccount` rows per user)
- A **unified "All Accounts"** view merges headers from all connected accounts, sorted by date, with a per-row account badge

---

## 4. Architecture

```
Browser (PWA)
    │
    │  OAuth consent → redirect callback
    ▼
NestJS API  (api/src/modules/mail/)
    │
    ├── OAuth: exchange code → access + refresh tokens (encrypted → PostgreSQL)
    │
    ├── Sync (on inbox open / manual refresh):
    │     Open IMAP (XOAUTH2) → fetch new headers since watermark
    │     → upsert MailHeader cache → return list to frontend
    │
    ├── Body fetch (on message open):
    │     Fetch full body live from IMAP → return raw HTML to frontend
    │     Frontend sanitizes with DOMPurify → stores in IndexedDB
    │
    └── Send / Reply / Forward:
          Nodemailer (SMTP + XOAUTH2) → append to Sent via IMAP
    │
PostgreSQL
    ├── MailAccount  (tokens, connection config)
    └── MailHeader   (cached metadata only — no bodies)

Browser IndexedDB  (apps/shared LocalDB system)
    └── mailBodies  (keyed by uid — device-local, never synced to server)
```

---

## 5. Data Model (Prisma)

### `MailAccount`
```prisma
model MailAccount {
  id             String        @id @default(cuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  provider       MailProvider  // GOOGLE | MICROSOFT
  emailAddress   String
  displayName    String?
  accessToken    String        // AES-256-GCM encrypted
  refreshToken   String        // AES-256-GCM encrypted
  tokenExpiresAt DateTime
  isShared       Boolean       @default(false)
  label          String?       // e.g. "Work", "info@company.org"
  lastSyncedAt   DateTime?
  createdAt      DateTime      @default(now())
  headers        MailHeader[]

  @@index([userId])
}

enum MailProvider {
  GOOGLE
  MICROSOFT
}
```

### `MailHeader`
```prisma
model MailHeader {
  id            String      @id @default(cuid())
  accountId     String
  account       MailAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  uid           String      // IMAP UID
  folder        String      // e.g. "INBOX", "[Gmail]/Sent Mail"
  subject       String?
  fromName      String?
  fromEmail     String?
  date          DateTime?
  isRead        Boolean     @default(false)
  hasAttachment Boolean     @default(false)
  snippet       String?     // first 120 chars of plain-text body
  syncedAt      DateTime    @default(now())

  @@unique([accountId, folder, uid])
  @@index([accountId, folder, date])
}
```

**Security:** `accessToken` and `refreshToken` encrypted with AES-256-GCM using `MAIL_ENCRYPTION_KEY` env var. Never stored in plaintext. Decrypted only in-memory during IMAP/SMTP operations.

---

## 6. Backend (NestJS)

### Module structure
```
api/src/modules/mail/
├── mail.module.ts
├── mail.controller.ts
├── mail-account.service.ts     # OAuth connect/disconnect, token refresh
├── mail-imap.service.ts        # IMAP: folders, headers, body fetch, flag updates
├── mail-smtp.service.ts        # Send / reply / forward
├── mail-sync.service.ts        # Sync pipeline: fetch new headers → upsert cache
├── mail-crypto.service.ts      # AES-256-GCM encrypt/decrypt
└── dto/
    ├── connect-account.dto.ts
    ├── send-message.dto.ts
    └── sync-result.dto.ts
```

### Libraries
- **`imapflow`** — IMAP client with native XOAUTH2 support
- **`nodemailer`** — SMTP send (existing `common/mail/` extended to accept per-user OAuth credentials)
- **`googleapis`** — Google OAuth token exchange only (not Gmail REST API)
- **`@azure/msal-node`** — Microsoft OAuth token exchange only (not Graph API)

### API Endpoints

**OAuth**
```
GET  /mail/auth/:provider/url         → returns consent screen URL (frontend redirects user)
GET  /mail/auth/:provider/callback    → exchange code, save MailAccount, redirect to /mail in PWA
     (internal) token refresh handled automatically inside mail-account.service.ts — no public endpoint
```

**Accounts**
```
GET    /mail/accounts                 → list user's connected accounts
DELETE /mail/accounts/:id             → disconnect (deletes account + cascades headers)
```

**Mail operations**
```
GET  /mail/:accountId/folders         → list IMAP folders with unread counts
GET  /mail/:accountId/headers         → cached headers (folder, page, limit params)
POST /mail/:accountId/sync            → trigger sync, returns new header count
GET  /mail/:accountId/message/:uid    → fetch full body live from IMAP
PATCH /mail/:accountId/message/:uid   → mark read/unread, move to folder
DELETE /mail/:accountId/message/:uid  → move to Trash
POST /mail/:accountId/send            → send new message
POST /mail/:accountId/reply           → reply to message
POST /mail/:accountId/forward         → forward message
```

### Token refresh strategy
`mail-account.service.ts` checks `tokenExpiresAt` before every IMAP/SMTP call. If expired (or within 5 minutes of expiry), it silently refreshes using the stored refresh token and updates the DB record. No user action required.

---

## 7. Shared Offline Cache (IndexedDB)

A new reusable system in `apps/shared/src/lib/local-db/` — **not mail-specific**. Any feature in the PWA can register stores and use generic get/put/delete/clear operations.

### Design
```
apps/shared/src/lib/local-db/
├── LocalDB.ts          # Core: IDBDatabase lifecycle, versioning, store registration
├── useLocalDB.ts       # React hook for consuming stores
└── index.ts
```

### Usage pattern
```ts
// Register stores (called once at app init, e.g. in App.tsx)
LocalDB.register({ store: 'mailBodies',     keyPath: 'uid',  version: 1 })
LocalDB.register({ store: 'financeReports', keyPath: 'id',   version: 1 })

// In any component / hook
const db = useLocalDB()
await db.put('mailBodies', { uid: '123', html: '<p>...</p>', cachedAt: Date.now() })
const body = await db.get('mailBodies', '123')
await db.delete('mailBodies', '123')
await db.clear('mailBodies')
```

- One `IDBDatabase` instance for the whole app (`portal-cache`)
- Version managed centrally — adding a new store bumps the DB version automatically
- Mail stores registered by the mail feature's entry point, not by `App.tsx` directly

---

## 8. Frontend (React PWA)

### Route & file structure
```
apps/pwa/src/pages/mail/
├── index.tsx                       # Route entry, layout shell
├── MailLayout.tsx                  # 3-pane responsive container
├── components/
│   ├── AccountSidebar.tsx          # Account switcher + folder tree
│   ├── MessageList.tsx             # Header list, infinite scroll, unread badges
│   ├── MessageDetail.tsx           # Body viewer (DOMPurify-sanitized HTML)
│   ├── ComposeModal.tsx            # Compose / Reply / Forward drawer
│   ├── AccountConnectPrompt.tsx    # Shown when no accounts connected
│   └── SyncButton.tsx             # Manual refresh with last-synced timestamp
└── hooks/
    ├── useMailAccounts.ts          # List + manage connected accounts
    ├── useMailHeaders.ts           # Fetch cached headers, handle pagination
    ├── useMailBody.ts              # IndexedDB-first body fetch
    └── useMailSync.ts             # Sync trigger, loading state, timestamp
```

### Layout
```
┌─────────────┬──────────────────┬───────────────────────────┐
│ All Accounts│ ● Jane  Budget.. │ From: Jane Doe            │
│ ● Primary   │   Tom   Meeting  │ Subject: Budget Review    │
│ ● info@     │   Sarah RE: Hi   │ Date: Jul 5, 2026         │
│             │                  │                           │
│ FOLDERS     │                  │ <sanitized HTML body>     │
│ Inbox  (3)  │                  │                           │
│ Sent        │                  │ [Reply] [Forward] [···]   │
│ Drafts      │                  │                           │
│ Junk        │                  │                           │
│ Trash       │    [↻ Refresh]   │                           │
└─────────────┴──────────────────┴───────────────────────────┘
```

- **Mobile**: single-pane with back navigation (accounts → list → detail)
- **"All Accounts" row**: merged headers from all connected accounts, sorted by date, account badge per row
- **Unread count**: shown on folder names and in sidebar nav item

### Sync behaviour
1. On mount → sync triggered for all accounts in background
2. Header list served immediately from PostgreSQL cache (no loading wait)
3. List updates reactively when sync completes
4. Body: IndexedDB check first → IMAP live fetch on miss → store in IndexedDB

### Security
- All email HTML bodies passed through **DOMPurify** before render (prevents XSS)
- No email content (body or attachment) stored in PostgreSQL
- IndexedDB entries include `cachedAt` timestamp — entries older than 30 days can be evicted

---

## 9. Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REDIRECT_URI=

# Encryption key for stored tokens (32-byte hex)
MAIL_ENCRYPTION_KEY=
```

---

## 10. Phase 2 Additions (out of scope now)

- **Push notifications**: Gmail Pub/Sub watch + Microsoft Graph subscriptions → webhook endpoint triggers sync pipeline (same code, different trigger)
- **IMAP IDLE**: persistent connection per account for near-real-time new mail detection
- **Attachment upload/download**: presigned URLs or streamed through API
- **Body-level search**: IMAP server-side SEARCH command
- **Folder management**: create, rename, delete IMAP folders
